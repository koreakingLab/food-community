import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconShield } from '../components/Icons';

const API_BASE = 'https://food-community-production.up.railway.app';

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1: 약관 동의 상태
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // Step 2: 입력 폼
  const [form, setForm] = useState({
    username: '', password: '', passwordConfirm: '',
    name: '', birthdate: '',
    company_name: '', position: '', business_number: '',
    phone: '', tel: '', email: '',
    address_zipcode: '', address_main: '', address_detail: '',
    marketing_agreed: false,
  });

  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState('');
  const [businessChecked, setBusinessChecked] = useState(false);
  const [businessMsg, setBusinessMsg] = useState('');
  const [businessLoading, setBusinessLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'username') {
      setUsernameChecked(false);
      setUsernameMsg('');
    }
    if (name === 'business_number') {
      setBusinessChecked(false);
      setBusinessMsg('');
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // 아이디 중복확인
  const checkUsername = async () => {
    if (!form.username || form.username.length < 4) {
      setUsernameMsg('아이디는 4자 이상 입력해주세요.');
      setUsernameChecked(false);
      return;
    }
    try {
      const res = await fetch(API_BASE + '/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username }),
      });
      const json = await res.json();
      setUsernameMsg(json.message);
      setUsernameChecked(json.available);
    } catch (err) {
      setUsernameMsg('확인 중 오류가 발생했습니다.');
    }
  };

  // ★ 사업자번호 상태조회
  const verifyBusiness = async () => {
    const cleanNumber = form.business_number.replace(/[^0-9]/g, '');
    if (cleanNumber.length !== 10) {
      setBusinessMsg('사업자번호는 10자리 숫자를 입력해주세요.');
      setBusinessChecked(false);
      return;
    }
    setBusinessLoading(true);
    setBusinessMsg('');
    try {
      const res = await fetch(API_BASE + '/api/auth/verify-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_number: form.business_number }),
      });
      const json = await res.json();
      setBusinessMsg(json.message);
      setBusinessChecked(json.success);
    } catch (err) {
      setBusinessMsg('사업자번호 조회 중 오류가 발생했습니다.');
      setBusinessChecked(false);
    } finally {
      setBusinessLoading(false);
    }
  };

  // 다음 주소 검색
  const searchAddress = () => {
    new window.daum.Postcode({
      oncomplete: function(data) {
        setForm(prev => ({
          ...prev,
          address_zipcode: data.zonecode,
          address_main: data.roadAddress || data.jibunAddress,
        }));
      }
    }).open();
  };

  // 유효성 검사
  const validate = () => {
    const newErrors = {};
    if (!form.username) newErrors.username = '아이디를 입력해주세요.';
    else if (!usernameChecked) newErrors.username = '아이디 중복확인을 해주세요.';
    if (!form.password) newErrors.password = '비밀번호를 입력해주세요.';
    else if (form.password.length < 8) newErrors.password = '비밀번호는 8자 이상이어야 합니다.';
    if (form.password !== form.passwordConfirm) newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    if (!form.name) newErrors.name = '성명을 입력해주세요.';
    if (!form.birthdate) newErrors.birthdate = '생년월일을 입력해주세요.';
    // ★ 사업자번호 필수 검증
    if (!form.business_number) newErrors.business_number = '사업자번호를 입력해주세요.';
    else if (!businessChecked) newErrors.business_number = '사업자번호 확인을 해주세요.';
    if (!form.company_name) newErrors.company_name = '업체명을 입력해주세요.';
    if (!form.phone) newErrors.phone = '핸드폰번호를 입력해주세요.';
    if (!form.email) newErrors.email = '이메일을 입력해주세요.';
    else if (form.email.endsWith('@daum.net') || form.email.endsWith('@hanmail.net')) {
      newErrors.email = '다음메일(Daum/Hanmail)은 사용할 수 없습니다.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 회원가입 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(API_BASE + '/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        alert('회원가입이 완료되었습니다! 로그인해주세요.');
        navigate('/login');
      } else {
        alert(json.message || '회원가입 실패');
      }
    } catch (err) {
      alert('오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Step 1: 약관 동의 =====
  if (step === 1) {
    return (
      <div className="signup-wrapper">
        <div className="signup-box">
          <h2 className="signup-title">회원가입</h2>
          <p className="signup-subtitle">
            <IconShield /> 본 서비스는 <strong>사업자(기업) 전용</strong>입니다.<br />
            사업자등록번호 확인 후 가입하실 수 있습니다.
          </p>
          <div className="terms-section">
            <div className="terms-block">
              <div className="terms-header">
                <label className="checkbox-label">
                  <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} />
                  <span className="checkbox-text">회원가입약관 동의 (필수)</span>
                </label>
              </div>
              <div className="terms-content">
                <p><strong>제1조 (목적)</strong></p>
                <p>이 약관은 식품업계 커뮤니티(이하 "회사")가 제공하는 서비스의 이용조건 및 절차, 회사와 회원 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                <p><strong>제2조 (이용계약의 성립)</strong></p>
                <p>① 이용계약은 회원이 되고자 하는 자가 약관의 내용에 대하여 동의를 한 다음 회원가입 신청을 하고 회사가 이러한 신청에 대하여 승낙함으로써 체결됩니다.</p>
                <p>② 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않을 수 있습니다.</p>
                <p>1. 실명이 아니거나 타인의 명의를 이용한 경우</p>
                <p>2. 허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</p>
                <p><strong>제3조 (서비스의 제공)</strong></p>
                <p>회사는 다음과 같은 서비스를 제공합니다.</p>
                <p>1. 식품업계 커뮤니티 서비스 (게시판, 뉴스, 정보 공유)</p>
                <p>2. HACCP 인증업체 조회 서비스</p>
                <p>3. 지원사업 공고 조회 서비스</p>
                <p>4. 원자재 시세 정보 서비스</p>
                <p><strong>제4조 (회원 탈퇴 및 자격 상실)</strong></p>
                <p>① 회원은 회사에 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.</p>
                <p>② 회원이 서비스 이용 시 법령 또는 이 약관의 의무를 위반한 경우 회사는 자격을 제한 또는 상실시킬 수 있습니다.</p>
              </div>
            </div>
            <div className="terms-block">
              <div className="terms-header">
                <label className="checkbox-label">
                  <input type="checkbox" checked={agreePrivacy} onChange={e => setAgreePrivacy(e.target.checked)} />
                  <span className="checkbox-text">개인정보취급방침 동의 (필수)</span>
                </label>
              </div>
              <div className="terms-content">
                <p><strong>1. 수집하는 개인정보 항목</strong></p>
                <p>회사는 회원가입, 서비스 이용 등을 위해 다음과 같은 개인정보를 수집합니다.</p>
                <p>- 필수항목: 아이디, 비밀번호, 성명, 생년월일, 핸드폰번호, 이메일, 사업자등록번호, 업체명</p>
                <p>- 선택항목: 직급, 연락처, 사업장주소</p>
                <p><strong>2. 개인정보의 수집 및 이용목적</strong></p>
                <p>- 회원 식별 및 가입의사 확인</p>
                <p>- 사업자 자격 확인</p>
                <p>- 서비스 제공 및 요금정산</p>
                <p>- 불량회원의 부정이용 방지</p>
                <p>- 각종 고지·통지, 분쟁 처리를 위한 기록 보존</p>
                <p><strong>3. 개인정보의 보유 및 이용기간</strong></p>
                <p>회원의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기합니다. 단, 관련 법령에 의해 보존할 필요가 있는 경우 해당 기간 동안 보존합니다.</p>
                <p>- 계약 또는 청약철회 등에 관한 기록: 5년</p>
                <p>- 소비자의 불만 또는 분쟁처리에 관한 기록: 3년</p>
                <p><strong>4. 개인정보의 파기</strong></p>
                <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
              </div>
            </div>
            <label className="checkbox-label agree-all">
              <input
                type="checkbox"
                checked={agreeTerms && agreePrivacy}
                onChange={e => { setAgreeTerms(e.target.checked); setAgreePrivacy(e.target.checked); }}
              />
              <span className="checkbox-text">전체 동의</span>
            </label>
          </div>
          <button
            className="btn-signup-next"
            disabled={!agreeTerms || !agreePrivacy}
            onClick={() => setStep(2)}
          >
            다음 단계로
          </button>
          <p className="signup-footer">이미 회원이신가요? <Link to="/login">로그인</Link></p>
        </div>
      </div>
    );
  }

  // ===== Step 2: 정보 입력 =====
  return (
    <div className="signup-wrapper">
      <div className="signup-box signup-box-wide">
        <h2 className="signup-title">기본정보 입력</h2>
        <p className="signup-subtitle"><span className="required-mark">*</span> 표시는 필수 입력 항목입니다.</p>

        <form onSubmit={handleSubmit} className="signup-form">
          {/* 아이디 */}
          <div className="form-group">
            <label>아이디 <span className="required-mark">*</span></label>
            <div className="input-with-btn">
              <input name="username" value={form.username} onChange={handleChange} placeholder="4자 이상 영문/숫자" />
              <button type="button" onClick={checkUsername} className="btn-check">중복확인</button>
            </div>
            {usernameMsg && <p className={usernameChecked ? 'msg-success' : 'msg-error'}>{usernameMsg}</p>}
            {errors.username && <p className="msg-error">{errors.username}</p>}
          </div>

          {/* 비밀번호 */}
          <div className="form-group">
            <label>비밀번호 <span className="required-mark">*</span></label>
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="8자 이상" />
            {errors.password && <p className="msg-error">{errors.password}</p>}
          </div>

          {/* 비밀번호 확인 */}
          <div className="form-group">
            <label>비밀번호 확인 <span className="required-mark">*</span></label>
            <input type="password" name="passwordConfirm" value={form.passwordConfirm} onChange={handleChange} placeholder="비밀번호를 다시 입력" />
            {errors.passwordConfirm && <p className="msg-error">{errors.passwordConfirm}</p>}
          </div>

          {/* 성명 */}
          <div className="form-group">
            <label>성명 <span className="required-mark">*</span></label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="실명을 입력해주세요" />
            {errors.name && <p className="msg-error">{errors.name}</p>}
          </div>

          {/* 생년월일 */}
          <div className="form-group">
            <label>생년월일 <span className="required-mark">*</span></label>
            <input type="date" name="birthdate" value={form.birthdate} onChange={handleChange} />
            {errors.birthdate && <p className="msg-error">{errors.birthdate}</p>}
          </div>

          <hr className="form-divider" />

          {/* ★ 사업자번호 (필수로 변경) */}
          <div className="form-group">
            <label>사업자번호 <span className="required-mark">*</span></label>
            <div className="input-with-btn">
              <input
                name="business_number"
                value={form.business_number}
                onChange={handleChange}
                placeholder="000-00-00000"
              />
              <button
                type="button"
                onClick={verifyBusiness}
                className="btn-check"
                disabled={businessLoading}
              >
                {businessLoading ? '조회중...' : '사업자확인'}
              </button>
            </div>
            {businessMsg && <p className={businessChecked ? 'msg-success' : 'msg-error'}>{businessMsg}</p>}
            {errors.business_number && <p className="msg-error">{errors.business_number}</p>}
          </div>

          {/* ★ 업체명 (필수로 변경) */}
          <div className="form-group">
            <label>업체명 <span className="required-mark">*</span></label>
            <input name="company_name" value={form.company_name} onChange={handleChange} placeholder="업체명" />
            {errors.company_name && <p className="msg-error">{errors.company_name}</p>}
          </div>

          {/* 직급 */}
          <div className="form-group">
            <label>직급</label>
            <input name="position" value={form.position} onChange={handleChange} placeholder="직급" />
          </div>

          <hr className="form-divider" />

          {/* 핸드폰번호 */}
          <div className="form-group">
            <label>핸드폰번호 <span className="required-mark">*</span></label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="010-0000-0000" />
            {errors.phone && <p className="msg-error">{errors.phone}</p>}
          </div>

          {/* 연락처 */}
          <div className="form-group">
            <label>연락처</label>
            <input name="tel" value={form.tel} onChange={handleChange} placeholder="회사 전화번호 등" />
          </div>

          {/* 이메일 */}
          <div className="form-group">
            <label>이메일 <span className="required-mark">*</span></label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="example@email.com" />
            <p className="msg-info">⚠️ 다음메일(Daum/Hanmail)은 사용할 수 없습니다.</p>
            {errors.email && <p className="msg-error">{errors.email}</p>}
          </div>

          <hr className="form-divider" />

          {/* 사업장주소 */}
          <div className="form-group">
            <label>사업장주소</label>
            <div className="input-with-btn">
              <input name="address_zipcode" value={form.address_zipcode} readOnly placeholder="우편번호" className="input-short" />
              <button type="button" onClick={searchAddress} className="btn-check">주소검색</button>
            </div>
            <input name="address_main" value={form.address_main} readOnly placeholder="기본주소" className="input-mt" />
            <input name="address_detail" value={form.address_detail} onChange={handleChange} placeholder="상세주소 입력" className="input-mt" />
          </div>

          <hr className="form-divider" />

          {/* 마케팅 동의 */}
          <div className="form-group marketing-section">
            <label className="checkbox-label">
              <input type="checkbox" name="marketing_agreed" checked={form.marketing_agreed} onChange={handleChange} />
              <span className="checkbox-text">마케팅 정보 수신 동의 (선택)</span>
            </label>
            <div className="marketing-desc">
              <p>서비스와 관련된 신규 기능 안내, 이벤트, 프로모션 등의 정보를 이메일 및 SMS로 받아보실 수 있습니다.</p>
              <p>마케팅 정보 수신에 동의하지 않으셔도 서비스 이용에는 제한이 없습니다. 동의 후에도 설정에서 언제든지 변경하실 수 있습니다.</p>
            </div>
          </div>

          {/* 버튼 */}
          <div className="signup-actions">
            <button type="button" onClick={() => setStep(1)} className="btn-signup-prev">이전</button>
            <button type="submit" className="btn-signup-submit" disabled={submitting}>
              {submitting ? '가입 처리 중...' : '회원가입'}
            </button>
          </div>
        </form>
        <p className="signup-footer">이미 회원이신가요? <Link to="/login">로그인</Link></p>
      </div>
    </div>
  );
}

export default SignupPage;