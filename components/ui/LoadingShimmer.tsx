'use client'

interface LoadingShimmerProps {
  width?: string | number
  height?: string | number
  className?: string
}

export function LoadingShimmer({ width, height, className = '' }: LoadingShimmerProps) {
  return (
    <div
      className={`shimmer ${className}`}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : '100%',
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : '16px',
      }}
    />
  )
}
