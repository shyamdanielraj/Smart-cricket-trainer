import { Card } from '../components/Card'

export function MatchInsightsPage() {
  return (
    <div className="space-y-6">
      <div className="glass glow-border rounded-2xl p-6">
        <div className="text-2xl font-bold text-white">Match Insights</div>
        <div className="mt-2 text-sm text-white/70">
          Gain deeper insights into your performance with advanced analytics and trends.
        </div>
      </div>

      <Card title="Coming soon" subtitle="We're building powerful match analysis features including shot heatmaps, performance trends, and opponent insights.">
        <div className="text-sm text-white/70">
          We're building powerful match analysis features including shot heatmaps, performance trends, and opponent insights.
        </div>
      </Card>
    </div>
  )
}

