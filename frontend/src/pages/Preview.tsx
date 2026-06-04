import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CheckCircle2, KanbanSquare, Lock, ScrollText, Users } from 'lucide-react';
import Logo from '../components/Logo';

const features = [
  { icon: KanbanSquare, title: 'Workspace Kanban', text: 'Plan personal work or team delivery without mixing ownership.' },
  { icon: Users, title: 'Member Access', text: 'Projects are visible only to members attached to the workspace.' },
  { icon: ScrollText, title: 'Readable Audit', text: 'System changes are presented as action summaries, not raw payloads.' },
  { icon: BarChart3, title: 'Delivery Reports', text: 'Velocity, workload, status, and weekly updates use live workspace data.' },
];

const Preview = () => (
  <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Logo size={34} />
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300">Sign in</Link>
          <Link to="/register" className="inline-flex h-8 items-center justify-center rounded-md border border-primary bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover">
            Create account
          </Link>
        </div>
      </div>
    </header>

    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1fr_420px] lg:items-center">
      <div>
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
          <Lock className="h-4 w-4" />
          Portfolio preview, no login required
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          TaskFlow is a clean workspace system for personal projects and focused team delivery.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
          This preview explains the product surface without exposing private deployed data. Sign in to use live projects, tasks, audit logs, webhooks, and reports.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/login" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover">
            Open app
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/register" className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            Start workspace
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <span className="text-sm font-bold">Workspace Snapshot</span>
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Operational</span>
        </div>
        <div className="space-y-3">
          {['Personal board', 'Team sprint', 'Audit trail', 'Discord webhook'].map((item, index) => (
            <div key={item} className="flex items-center justify-between rounded-md border border-slate-100 p-3 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold">{item}</span>
              </div>
              <span className="text-xs text-slate-500">0{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-14 md:grid-cols-2 lg:grid-cols-4">
      {features.map((feature) => (
        <article key={feature.title} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <feature.icon className="mb-4 h-5 w-5 text-primary" />
          <h2 className="font-bold">{feature.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{feature.text}</p>
        </article>
      ))}
    </section>
  </main>
);

export default Preview;
