import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  GitBranch,
  KanbanSquare,
  Lock,
  ScrollText,
  ShieldCheck,
  Users,
  Webhook,
} from 'lucide-react';
import Logo from '../components/Logo';

const features = [
  { icon: KanbanSquare, title: 'Workspace Kanban', text: 'Plan private work, backlog items, and active sprint cards without mixing ownership between scopes.' },
  { icon: Users, title: 'Member Access', text: 'Projects are visible only to users attached to the same workspace, with role-aware collaboration flows.' },
  { icon: ScrollText, title: 'Readable Audit Logs', text: 'Create, update, delete, member, and comment changes are summarized for review instead of shown as raw JSON.' },
  { icon: BarChart3, title: 'Delivery Reports', text: 'Velocity, workload, status distribution, daily notes, and weekly reports are grouped by workspace data.' },
];

const modules = [
  { icon: Database, label: 'Neon-ready schema', value: 'Migrations and seed data' },
  { icon: GitBranch, label: 'Sprint planning', value: 'Backlog to active board' },
  { icon: Webhook, label: 'Webhook integrations', value: 'Discord-style delivery events' },
  { icon: Activity, label: 'System health', value: 'API and database visibility' },
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

    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1fr_440px] lg:items-center">
      <div>
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
          <Lock className="h-4 w-4" />
          Portfolio preview, no login required
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          TaskFlow Workspace keeps personal projects and team delivery in one clean management app.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
          Review the public product surface before signing in. The live app covers workspace access, projects, backlog planning, sprint boards, task ownership, reports, audit logs, notifications, and webhook integrations.
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
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

    <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 md:grid-cols-2 lg:grid-cols-4">
      {features.map((feature) => (
        <article key={feature.title} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <feature.icon className="mb-4 h-5 w-5 text-primary" />
          <h2 className="font-bold">{feature.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{feature.text}</p>
        </article>
      ))}
    </section>

    <section className="mx-auto max-w-6xl px-4 pb-16">
      <div className="grid gap-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[0.9fr_1.1fr] lg:p-6">
        <div>
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-primary dark:bg-blue-950">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold">Built as a portfolio-ready project management system.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            TaskFlow is designed to demonstrate practical SaaS foundations: authenticated workspaces, scoped project data, sprint execution, clear audit history, integration settings, responsive UI states, and deployable database migrations.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {modules.map((module) => (
            <article key={module.label} className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <module.icon className="mb-3 h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold">{module.label}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{module.value}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  </main>
);

export default Preview;
