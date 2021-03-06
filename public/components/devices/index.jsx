import React from 'react'
import mqtt from 'mqtt'

import { Session } from '../lib'
import { _coords } from './helper'

import FilterSVG from './filter-svg.jsx'
import Device from './device.jsx'
import VersionPod from '../misc/version-pod.jsx'
import RefreshPod from './refresh-pod.jsx'

export default class Devices extends React.Component {
  constructor () {
    super()
    this.mqtt = mqtt.connect(window.mqttUri)
    this.state = { devices: Session.load('devices') || [], dragging: false, ox: -400, oy: -200, zoom: 800 }
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
    this.onWheel = this.onWheel.bind(this)
  }

  onMouseMove (event) {
    if (!this.state.dragging) return
    const { rx, ry, ox, oy, zoom } = this.state
    const { left, top } = this.devicesMap.getBoundingClientRect()
    const { x, y } = {
      x: (event.pageX || document.body.scrollLeft + document.documentElement.scrollLeft) - left,
      y: (event.pageY || document.body.scrollTop + document.documentElement.scrollTop) - top
    }
    this.devicesMap.setAttribute('viewBox', `${rx - x + ox} ${ry - y + oy} ${zoom} ${zoom}`)
  }

  onMouseDown (event) {
    this.setState({ dragging: true })
    const { left, top } = this.devicesMap.getBoundingClientRect()
    this.setState({
      rx: (event.pageX || document.body.scrollLeft + document.documentElement.scrollLeft) - left,
      ry: (event.pageY || document.body.scrollTop + document.documentElement.scrollTop) - top
    })
  }

  onMouseUp (event) {
    this.setState({ dragging: false })
    const { rx, ry, ox, oy } = this.state
    const { left, top } = this.devicesMap.getBoundingClientRect()
    const { x, y } = {
      x: (event.pageX || document.body.scrollLeft + document.documentElement.scrollLeft) - left,
      y: (event.pageY || document.body.scrollTop + document.documentElement.scrollTop) - top
    }
    this.setState({ ox: rx - x + ox, oy: ry - y + oy })
  }

  onWheel (event) {
    event.preventDefault()
  }

  zoom (amount) {
    console.log(amount)
    this.setState({ zoom: this.state.zoom * amount })
  }

  // Join to the nth element through a path
  connect (a, b) {
    const [ x1, y1 ] = _coords(a, 'array')
    const [ x2, y2 ] = _coords(b, 'array')
    return <line className='connection' key={a + '-' + b} x1={x1} y1={y1} x2={x2 || 0} y2={y2 || 0}
    strokeDasharray='4, 4' stroke='white' strokeWidth={0.2} />
  }

  componentWillMount () {
    this.mqtt.subscribe('netbeast/network')
    this.mqtt.on('message', (topic, message) => {
      if (topic !== 'netbeast/network') return

      const devices = JSON.parse(message)
      Session.save('devices', devices)
      this.setState({ devices })
    })
  }

  componentWillUnmount () {
    this.mqtt.unsubscribe('netbeast/network')
  }

  render () {
    const { devices, ox, oy, zoom } = this.state
    var filters = [ ... new Set(devices.map((data) => { return data.app || 'default' })) ]

    return (
      <span>
        <div className='devices-view'>

          <svg className='devices-map grabbable' ref={(ref) => this.devicesMap = ref}
          viewBox={`${ox} ${oy} ${zoom} ${zoom}`} onMouseMove={this.onMouseMove}
          onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp}
          onWheel={this.onWheel}>

          {filters.map((src, idx) => <FilterSVG key={src} src={src}/>)}
          {devices.map((src, idx) => this.connect(idx))}

          <filter id={'netbot'} x='0%' y='0%' width='100%' height='100%'>
            <feImage xlinkHref='/img/netbot.png' />
          </filter>
          <circle cx={0} cy={0} r='70' style={{ filter: 'url(#netbot)' }} />

          {devices.map((data, idx) => <Device key={idx} info={data} idx={idx} />)}

          </svg>
        </div>
        <div className='zoom-pod'>
          <div className='zoom-more clickable' onClick={this.zoom.bind(this, 0.9)}>+</div>
          <div className='zoom-less clickable' onClick={this.zoom.bind(this, 1.1)}>-</div>
        </div>
        <VersionPod />
        <RefreshPod />
      </span>
    )
  }
}

// Refs
//
// http://stackoverflow.com/questions/6088409/svg-drop-shadow-using-css3
