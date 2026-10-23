import React from 'react';
import { AlertCircle, RotateCw, Gamepad2 } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('RandGames ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f4f4ec] text-black select-none">
          <div className="max-w-md w-full border-4 border-black bg-white p-6 brutal-shadow-xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto bg-[#ef4444] border-3 border-black flex items-center justify-center text-white brutal-shadow-sm">
              <AlertCircle className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h2 className="font-brutal text-xl font-black uppercase tracking-tight">
                ARENA ENCOUNTERED AN ERROR
              </h2>
              <p className="font-mono text-xs text-neutral-600 mt-1">
                {this.state.error?.message || 'A render exception occurred in the active arena module.'}
              </p>
            </div>

            <div className="p-3 bg-neutral-100 border-2 border-black font-mono text-[11px] text-left overflow-x-auto text-neutral-700 max-h-32">
              <code>{this.state.error?.stack?.split('\n').slice(0, 3).join('\n') || 'No stack trace available.'}</code>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="brutal-press flex-1 py-3 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center justify-center gap-1.5"
              >
                <RotateCw className="w-4 h-4" />
                <span>RETRY / RECOVER</span>
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReturnHub) this.props.onReturnHub();
                  else window.location.href = '/';
                }}
                className="brutal-press flex-1 py-3 bg-[#facc15] hover:bg-yellow-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center justify-center gap-1.5"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>ALL GAMES</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
