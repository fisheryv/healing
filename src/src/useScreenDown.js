/**
 * useScreenDown.js — 屏幕朝下检测 Hook
 *
 * 通过加速度计持续读取设备姿态，判断手机是否处于屏幕朝下状态。
 * 判定阈值：Z 轴加速度 > 8 m/s²（重力方向向上时屏幕朝下）。
 *
 * Web 环境（Chrome/Android）使用 DeviceMotionEvent.accelerationIncludingGravity.z
 * iOS 13+ 需要先调用 DeviceMotionEvent.requestPermission() 申请权限。
 * 不支持加速度计的设备降级为"始终朝下"（模拟器/桌面）。
 *
 * 同时监听 visibilitychange，当 App 切到后台时也判定为"非朝下"（用于防分心）。
 */
import { useEffect, useRef, useState, useCallback } from 'react'

// 屏幕朝下判定阈值：Z 轴加速度（含重力）> 8 m/s²
const FACE_DOWN_THRESHOLD = 8

// 朝下状态需要连续若干帧确认，避免抖动误触发
const CONFIRM_FRAMES = 2

/**
 * 独立的权限请求函数，可在用户手势（按钮点击）中调用。
 * iOS 13+ 要求 DeviceMotionEvent.requestPermission() 必须在用户手势的
 * 同步调用栈中执行，否则权限弹窗不会出现。
 * 在 hook 之外的组件（如 FocusConfig）中调用此函数，提前获取权限，
 * 之后 useScreenDown 内部再次调用时会直接返回已授权状态。
 */
export async function requestMotionPermission() {
  if (typeof DeviceMotionEvent === 'undefined') return 'unsupported'
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      return await DeviceMotionEvent.requestPermission()
    } catch (e) {
      return 'denied'
    }
  }
  // 非 iOS，无需权限
  return 'granted'
}

export function useScreenDown(enabled = true) {
  const [screenDown, setScreenDown] = useState(true)
  const [hasSensor, setHasSensor] = useState(false)
  // 朝下帧计数（平滑去抖）
  const downFramesRef = useRef(0)
  const upFramesRef = useRef(0)
  // 权限状态
  const [permission, setPermission] = useState('unknown') // 'granted' | 'denied' | 'unknown'
  // 当前真实姿态（不受 visibility 影响），供 visibility 逻辑使用
  const rawDownRef = useRef(true)

  // 请求 iOS 权限（复用外部 requestMotionPermission）
  const requestPermission = useCallback(async () => {
    const res = await requestMotionPermission()
    setPermission(res)
    return res
  }, [])

  useEffect(() => {
    if (!enabled) {
      // 关闭强制屏幕朝下：始终为"朝下"状态，不触发防分心
      setScreenDown(true)
      return
    }

    let mounted = true

    const handleMotion = (e) => {
      if (!mounted) return
      const acc = e.accelerationIncludingGravity
      if (!acc || acc.z == null) return

      if (!hasSensor) setHasSensor(true)

      // Z 轴 > 阈值 => 屏幕朝下（重力 +Z 方向）
      const isDown = acc.z > FACE_DOWN_THRESHOLD

      if (isDown) {
        downFramesRef.current = Math.min(downFramesRef.current + 1, CONFIRM_FRAMES + 5)
        upFramesRef.current = 0
      } else {
        upFramesRef.current = Math.min(upFramesRef.current + 1, CONFIRM_FRAMES + 5)
        downFramesRef.current = 0
      }

      // 连续 CONFIRM_FRAMES 帧后切换状态，去抖
      const rawDown = downFramesRef.current >= CONFIRM_FRAMES
      const rawUp = upFramesRef.current >= CONFIRM_FRAMES

      if (rawDown) {
        rawDownRef.current = true
        if (document.visibilityState === 'visible') setScreenDown(true)
      } else if (rawUp) {
        rawDownRef.current = false
        if (document.visibilityState === 'visible') setScreenDown(false)
      }
    }

    // App 切到后台时也触发防分心（document.hidden => 非朝下）
    const handleVisibility = () => {
      if (!mounted) return
      if (document.hidden) {
        // 切后台 = 非朝下（拿起手机的等价行为）
        setScreenDown(false)
      } else {
        // 切回前台时，根据真实姿态恢复
        setScreenDown(rawDownRef.current)
      }
    }

    // 尝试自动请求权限（iOS 13+ 需在用户手势内调用）
    // 这里尝试一次；若权限被拒或环境不支持，降级为"始终朝下"
    const tryAttach = async () => {
      const perm = await requestPermission()
      if (perm === 'granted' || perm === 'unsupported') {
        window.addEventListener('devicemotion', handleMotion)
        document.addEventListener('visibilitychange', handleVisibility)
      }
      // 权限被拒或不支持传感器时，screenDown 维持 true（不触发防分心）
    }

    tryAttach()

    return () => {
      mounted = false
      window.removeEventListener('devicemotion', handleMotion)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  return { screenDown, hasSensor, permission, requestPermission }
}
