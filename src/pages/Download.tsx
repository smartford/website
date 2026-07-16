import { M3eActionList, M3eListAction } from '@m3e/react/list'
import { useOutletContext } from 'react-router-dom'

interface ContextType {
  isLeaving: boolean
  handleAnimationEnd: (e: React.AnimationEvent) => void
}

export function Download() {
  
  const { isLeaving, handleAnimationEnd } = useOutletContext<ContextType>()

  return (
    <div 
      id="page-download"
      className={`page-view ${isLeaving ? 'leaving' : ''}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <h1>Скачать</h1>
      <M3eActionList variant="segmented">
        <M3eListAction href="/download/smosb1.05.pptm" target="_blank">SmartfordOS Beta 1.05</M3eListAction>
        <M3eListAction href="/download/smosb1.2.pptm" target="_blank">SmartfordOS Beta 1.2</M3eListAction>
        <M3eListAction href="/download/smos1.0.pptm" target="_blank">SmartfordOS 1.0</M3eListAction>
        <M3eListAction href="/download/smos1.5.pptm" target="_blank">SmartfordOS 1.5</M3eListAction>
        <M3eListAction href="/download/smos2.0.pptm" target="_blank">SmartfordOS 2.0</M3eListAction>
        <M3eListAction href="/download/smos2.1.pptm" target="_blank">SmartfordOS 2.1</M3eListAction>
        <M3eListAction href="/download/smos2.2.pptm" target="_blank">SmartfordOS 2.2</M3eListAction>
      </M3eActionList>
    </div>
  )
}
