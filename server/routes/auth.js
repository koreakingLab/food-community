const router = require('express').Router();
const { supabase } = require('../lib/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// ========== 아이디 중복확인 ==========
router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.length < 4) {
      return res.status(400).json({ available: false, message: '아이디는 4자 이상이어야 합니다.' });
    }

    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (data) {
      return res.json({ available: false, message: '이미 사용 중인 아이디입니다.' });
    }
    res.json({ available: true, message: '사용 가능한 아이디입니다.' });
  } catch (err) {
    // .single()은 결과 없으면 에러를 던짐 → 사용 가능
    res.json({ available: true, message: '사용 가능한 아이디입니다.' });
  }
});

// ========== 이메일 중복확인 ==========
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    // 다음메일 차단
    if (email && (email.endsWith('@daum.net') || email.endsWith('@hanmail.net'))) {
      return res.status(400).json({ available: false, message: '다음메일(Daum/Hanmail)은 사용할 수 없습니다.' });
    }

    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (data) {
      return res.json({ available: false, message: '이미 등록된 이메일입니다.' });
    }
    res.json({ available: true, message: '사용 가능한 이메일입니다.' });
  } catch (err) {
    res.json({ available: true, message: '사용 가능한 이메일입니다.' });
  }
});

// ========== 회원가입 ==========
router.post('/signup', async (req, res) => {
  try {
    const {
      username, password, name, birthdate,
      company_name, position, business_number,
      phone, tel, email,
      address_zipcode, address_main, address_detail,
      marketing_agreed
    } = req.body;

    // 필수값 검증
    if (!username || !password || !name || !birthdate || !phone || !email) {
      return res.status(400).json({ success: false, message: '필수 항목을 모두 입력해주세요.' });
    }

    // 비밀번호 최소 8자
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: '비밀번호는 8자 이상이어야 합니다.' });
    }

    // 다음메일 차단
    if (email.endsWith('@daum.net') || email.endsWith('@hanmail.net')) {
      return res.status(400).json({ success: false, message: '다음메일(Daum/Hanmail)은 사용할 수 없습니다.' });
    }

    // 아이디 중복 체크
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ success: false, message: '이미 사용 중인 아이디입니다.' });
    }

    // 이메일 중복 체크
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return res.status(409).json({ success: false, message: '이미 등록된 이메일입니다.' });
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // DB 저장
    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        password: hashedPassword,
        name,
        nickname: name,  // 닉네임은 이름으로 기본 설정
        birthdate,
        company_name: company_name || null,
        position: position || null,
        business_number: business_number || null,
        phone,
        tel: tel || null,
        email,
        address_zipcode: address_zipcode || null,
        address_main: address_main || null,
        address_detail: address_detail || null,
        marketing_agreed: marketing_agreed || false,
      })
      .select('id, username, name, email')
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: data,
    });
  } catch (err) {
    console.error('회원가입 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// ========== 로그인 ==========
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        company_name: user.company_name,
      },
    });
  } catch (err) {
    console.error('로그인 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// ========================================
// JWT 인증 미들웨어 (routes/auth.js 맨 아래, module.exports 전)
// ========================================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
}

module.exports = { router, authMiddleware };