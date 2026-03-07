const CarImage = ({ carNumber, className = "" }) => {
  return (
    <img
      src={`/cars/${carNumber}.png`}
      alt={`Car #${carNumber}`}
      className={className}
      onError={(e) => {
        e.target.style.display = 'none'
      }}
    />
  )
}

export default CarImage