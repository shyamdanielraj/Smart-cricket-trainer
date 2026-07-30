import React from 'react'

type Props = {
  children: React.ReactNode
  fallback: React.ReactNode
}

type State = { error: Error | null }

/**
 * Catches render errors from React Three Fiber / loaders so one bad GLB or WebGL issue
 * does not blank the entire dashboard.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Smart Cricket 3D]', error, info.componentStack)
  }

  render() {
    if (this.state.error) return this.props.fallback
    return this.props.children
  }
}
