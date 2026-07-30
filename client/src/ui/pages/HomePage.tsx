import { Link } from 'react-router-dom'
import { Card } from '../components/Card'
import { useAuth } from '../../state/auth'

export function HomePage() {
  const { user } = useAuth()
  return (
    <div className="space-y-6">
      <div className="glass glow-border rounded-2xl p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm text-white/60">Welcome back</div>
            <div className="text-2xl font-bold text-white">{user?.username}</div>
            <div className="mt-2 max-w-2xl text-sm text-white/70">
              Analyze your batting technique using AI-powered shot detection and interactive 3D visualization.
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
              to="/ai"
            >
              AI Shot Classifier
            </Link>
            <Link
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
              to="/lab"
            >
              3D Batting Lab
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          title="AI Pipeline"
          subtitle="Supports real-time and file-based analysis with automatic validation."
        >
          <div className="text-sm text-white/70">
            Upload your data and get instant shot predictions powered by your AI model.
          </div>
        </Card>
        <Card title="Shot Distribution" subtitle="Track your shot patterns and identify your most played strokes at a glance.">
          <div className="text-sm text-white/70">
            Track your shot patterns and identify your most played strokes at a glance.
          </div>
        </Card>
        <Card title="3D Batting Styles" subtitle="Visualize your shots in immersive 3D to better understand your technique.">
          <div className="text-sm text-white/70">
            Visualize your shots in immersive 3D to better understand your technique.
          </div>
        </Card>
      </div>
    </div>
  )
}

