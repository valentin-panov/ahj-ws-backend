function formatDate(date) {
  const d = new Date(date);
  const day = d.getDate();
  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const formatTime = (x) => (x < 10 ? `0${x}` : x);

  return `${day} ${month} ${year} ${formatTime(hours)}:${formatTime(minutes)}`;
}

module.exports = formatDate;
