import CarImage from './CarImage'

const DriverCard = ({
  driver,
  tier,
  finishingPosition,
  showPosition = true,
  selected = false,
  onClick = null,
}) => {
  const positionColor =
    finishingPosition <= 5
      ? 'text-green-400'
      : finishingPosition <= 10
        ? 'text-yellow-400'
        : finishingPosition <= 15
          ? 'text-orange-400'
          : 'text-red-400'

  const cardStyles = selected
    ? {
        backgroundColor: driver.primary_color + '33',
        borderColor: driver.primary_color,
      }
    : {}

  const CardWrapper = onClick ? 'button' : 'div'

  return (
    <CardWrapper
      onClick={onClick}
      style={{
        borderLeft: !onClick ? `4px solid ${driver.primary_color}` : undefined,
        ...cardStyles,
      }}
      className={`bg-gray-800 rounded p-2 text-left ${
        onClick
          ? `border transition-colors ${selected ? '' : 'border-gray-800 hover:border-gray-600'}`
          : ''
      }`}
    >
      {tier && (
        <div className="text-gray-500 text-xs uppercase mb-1">Tier {tier}</div>
      )}
      <div className="flex items-center gap-2">
        <CarImage
          carNumber={driver.car_number}
          className="w-12 h-8 object-contain flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: driver.primary_color }}
            />
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: driver.secondary_color }}
            />
            <div className="font-bold text-sm truncate">{driver.name}</div>
          </div>
          <div className="text-gray-400 text-xs truncate">
            #{driver.car_number} • {driver.team_name}
          </div>
        </div>
        {showPosition && finishingPosition && (
          <div className={`text-lg font-black flex-shrink-0 ${positionColor}`}>
            {finishingPosition}
          </div>
        )}
      </div>
    </CardWrapper>
  )
}

export default DriverCard
