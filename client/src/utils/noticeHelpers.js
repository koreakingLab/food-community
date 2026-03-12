export function formatNoticeDate(notice) {
  if (notice.reqst_date_raw && !notice.reqst_begin_de) return notice.reqst_date_raw;
  const begin = notice.reqst_begin_de ? new Date(notice.reqst_begin_de).toLocaleDateString('ko-KR') : '-';
  const end = notice.reqst_end_de ? new Date(notice.reqst_end_de).toLocaleDateString('ko-KR') : '-';
  return begin + ' ~ ' + end;
}

export function getNoticeStatus(notice) {
  if (!notice.reqst_end_de) return { text: '상시', cls: 'badge-ongoing' };
  const today = new Date().toISOString().split('T')[0];
  if (notice.reqst_end_de >= today) return { text: '접수중', cls: 'badge-active' };
  return { text: '마감', cls: 'badge-expired' };
}