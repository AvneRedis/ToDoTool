import { useState, useEffect } from 'react'

const BackgroundSlideshow = () => {
  // Classic Defender V8 Works photography (local images)
  const defenderImages = [
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_01.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_02.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_03.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_04.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_05.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_06.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_07.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_08.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_09.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_10.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_11.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_12.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_13.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_14.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_15.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_16.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_17.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_18.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_19.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_20.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_21.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_22.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_23.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_24.jpg',
    '/classic-defender-v8/DEF_CLASSIC_V8_WORKS_210824_25.jpg'
  ]

  // Start with a random image on page load
  const getRandomIndex = () => Math.floor(Math.random() * defenderImages.length)
  const [currentImageIndex, setCurrentImageIndex] = useState(getRandomIndex())
  const [nextImageIndex, setNextImageIndex] = useState(() => {
    const current = getRandomIndex()
    return (current + 1) % defenderImages.length
  })
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)

      setTimeout(() => {
        setCurrentImageIndex(nextImageIndex)
        setNextImageIndex((nextImageIndex + 1) % defenderImages.length)
        setIsTransitioning(false)
      }, 1000) // 1 second transition

    }, 3600000) // Change image every 1 hour (3,600,000 milliseconds)

    return () => clearInterval(interval)
  }, [nextImageIndex, defenderImages.length])

  return (
    <div className="background-slideshow">
      {/* Current Image */}
      <div
        className={`background-image ${isTransitioning ? 'fade-out' : 'fade-in'}`}
        style={{
          backgroundImage: `url(${defenderImages[currentImageIndex]})`,
        }}
      />

      {/* Next Image (for smooth transition) */}
      <div
        className={`background-image next-image ${isTransitioning ? 'fade-in' : 'fade-out'}`}
        style={{
          backgroundImage: `url(${defenderImages[nextImageIndex]})`,
        }}
      />



      {/* Optional: Image attribution */}
      <div className="image-attribution">
        Classic Defender V8 Works Photography
      </div>
    </div>
  )
}

export default BackgroundSlideshow
