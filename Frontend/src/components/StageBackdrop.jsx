const SCENES = [
  { id: 'phone', src: '/zoom/zoom-phone.png?v=toon' },
  { id: 'desk', src: '/zoom/zoom-desk.png?v=toon' },
  { id: 'house', src: '/zoom/zoom-house.png?v=toon' },
  { id: 'country', src: '/zoom/zoom-country.png?v=toon' },
  { id: 'earth', src: '/zoom/zoom-earth.png?v=toon' },
]

export default function StageBackdrop({ mode }) {
  return (
    <div className={`earth-zoom earth-zoom--${mode}`} aria-hidden="true">
      {SCENES.map((scene) => (
        <div key={scene.id} className={`zoom-scene zoom-scene--${scene.id}`}>
          <img className="zoom-art" src={scene.src} alt="" draggable="false" />
        </div>
      ))}
    </div>
  )
}
