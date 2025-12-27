import PropTypes from 'prop-types';

const StatCard = ({ label, value, delta, tone = 'default' }) => (
  <div className={`stat-card stat-card--${tone}`}>
    <p className="stat-card__label">{label}</p>
    <p className="stat-card__value">{value}</p>
    {delta !== undefined && (
      <p className="stat-card__delta">{delta > 0 ? `▲ ${delta}` : `▼ ${Math.abs(delta)}`}</p>
    )}
  </div>
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  delta: PropTypes.number,
  tone: PropTypes.oneOf(['default', 'success', 'warn'])
};

export default StatCard;
