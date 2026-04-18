'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Activity,
  Clock,
  UserCircle2,
  Filter,
  RefreshCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Search,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AuditLog {
  _id: string;
  action: string;
  actorId: string | null;
  actorRole: string | null;
  actorName: string | null;
  actorEmail: string | null;
  resourceType: string;
  resourceId: string | null;
  success: boolean;
  metadata: unknown;
  requestMeta: {
    ip?: string;
    userAgent?: string;
    method?: string;
    path?: string;
    requestId?: string;
  } | null;
  createdAt: string | null;
  previousHash: string | null;
  hash: string | null;
  schemaVersion: number | null;
}

interface Stats {
  total: number;
  last24h: number;
  last7d: number;
  failed24h: number;
  failedLogins7d: number;
  topActions: Array<{ action: string; count: number }>;
  topActors: Array<{
    actorId: string;
    count: number;
    name: string | null;
    email: string | null;
    role: string | null;
  }>;
  latestAt: string | null;
}

const ACTION_OPTIONS = [
  'AUTH_LOGIN_SUCCESS',
  'AUTH_LOGIN_FAILED',
  'AUTH_PASSWORD_RESET',
  'USER_CREATED',
  'USER_ROLE_UPDATED',
  'USER_STATUS_UPDATED',
  'EVENT_UPDATED',
  'EVENT_DELETED',
  'GALLERY_IMAGE_DELETED',
  'GALLERY_FOLDER_DELETED',
];
const RESOURCE_OPTIONS = ['auth', 'user', 'event', 'gallery'];

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function actionSeverity(action: string, success: boolean): 'critical' | 'warning' | 'info' {
  if (!success) return 'critical';
  if (action.endsWith('_DELETED') || action === 'USER_ROLE_UPDATED') return 'warning';
  return 'info';
}

function severityStyles(sev: 'critical' | 'warning' | 'info') {
  switch (sev) {
    case 'critical':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50';
    case 'warning':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50';
    default:
      return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-900/50';
  }
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition"
      data-testid={`copy-btn-${label || 'value'}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function SecurityLogsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [q, setQ] = useState('');
  const [action, setAction] = useState<string>('all');
  const [resourceType, setResourceType] = useState<string>('all');
  const [successFilter, setSuccessFilter] = useState<'all' | 'success' | 'fail'>('all');
  const limit = 50;

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (q.trim()) params.set('q', q.trim());
    if (action !== 'all') params.set('action', action);
    if (resourceType !== 'all') params.set('resourceType', resourceType);
    if (successFilter === 'success') params.set('success', 'true');
    if (successFilter === 'fail') params.set('success', 'false');
    return params.toString();
  }, [page, q, action, resourceType, successFilter]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/security-logs/stats', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Stats HTTP ${res.status}`);
      setStats(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/security-logs?${buildQuery()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.pagination?.total || 0);
      setPages(data.pagination?.pages || 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const resetFilters = () => {
    setQ('');
    setAction('all');
    setResourceType('all');
    setSuccessFilter('all');
    setPage(1);
  };

  const statCards = useMemo(
    () => [
      {
        label: 'Events · last 24h',
        value: stats?.last24h ?? 0,
        icon: Activity,
        tone: 'info' as const,
        testid: 'stat-last24h',
      },
      {
        label: 'Failed events · 24h',
        value: stats?.failed24h ?? 0,
        icon: AlertTriangle,
        tone: ((stats?.failed24h ?? 0) > 0 ? 'critical' : 'info') as
          | 'critical'
          | 'warning'
          | 'info',
        testid: 'stat-failed24h',
      },
      {
        label: 'Events · last 7d',
        value: stats?.last7d ?? 0,
        icon: Clock,
        tone: 'info' as const,
        testid: 'stat-last7d',
      },
      {
        label: 'Failed logins · 7d',
        value: stats?.failedLogins7d ?? 0,
        icon: Shield,
        tone: ((stats?.failedLogins7d ?? 0) > 0 ? 'warning' : 'info') as
          | 'critical'
          | 'warning'
          | 'info',
        testid: 'stat-failed-logins',
      },
    ],
    [stats],
  );

  return (
    <div className="space-y-6" data-testid="security-logs-dashboard">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" /> Security Logs
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Hash-chained audit trail of privileged actions across the platform.
            {stats?.latestAt && (
              <>
                {' '}
                Latest event:{' '}
                <span className="font-medium">{fmtTime(stats.latestAt)}</span>.
              </>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadStats();
            loadLogs();
          }}
          data-testid="refresh-btn"
        >
          <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((s) => (
          <Card key={s.label} data-testid={s.testid}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    {s.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold mt-1">
                    {statsLoading ? '—' : s.value.toLocaleString()}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-lg border ${severityStyles(s.tone)}`}
                >
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top actions + actors */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Top Actions · 7d
            </h3>
            {statsLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : stats?.topActions.length ? (
              <ul className="space-y-2" data-testid="top-actions-list">
                {stats.topActions.map((a) => (
                  <li
                    key={a.action}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-mono text-xs text-gray-800">
                      {a.action}
                    </span>
                    <Badge variant="secondary">{a.count}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No recent activity.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <UserCircle2 className="h-4 w-4" /> Top Actors · 7d
            </h3>
            {statsLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : stats?.topActors.length ? (
              <ul className="space-y-2" data-testid="top-actors-list">
                {stats.topActors.map((a) => (
                  <li
                    key={a.actorId}
                    className="flex items-center justify-between text-sm gap-2"
                  >
                    <div className="truncate">
                      <span className="font-medium truncate">
                        {a.name || 'Unknown user'}
                      </span>
                      {a.role && (
                        <span className="ml-2 text-xs text-gray-500">
                          {a.role}
                        </span>
                      )}
                    </div>
                    <Badge variant="secondary">{a.count}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No recent activity.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-600" />
            <h3 className="font-semibold text-sm">Filters</h3>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search IP, path, actor id…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
                data-testid="search-input"
              />
            </div>

            <Select
              value={action}
              onValueChange={(v) => {
                setAction(v);
                setPage(1);
              }}
            >
              <SelectTrigger data-testid="action-select">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {ACTION_OPTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={resourceType}
              onValueChange={(v) => {
                setResourceType(v);
                setPage(1);
              }}
            >
              <SelectTrigger data-testid="resource-select">
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All resources</SelectItem>
                {RESOURCE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select
                value={successFilter}
                onValueChange={(v) => {
                  setSuccessFilter(v as 'all' | 'success' | 'fail');
                  setPage(1);
                }}
              >
                <SelectTrigger data-testid="status-select">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any status</SelectItem>
                  <SelectItem value="success">Success only</SelectItem>
                  <SelectItem value="fail">Failed only</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                data-testid="reset-filters-btn"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events table */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm text-gray-600">
              {loading
                ? 'Loading events…'
                : `${total.toLocaleString()} event${total === 1 ? '' : 's'} matched`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                data-testid="prev-page-btn"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600" data-testid="pagination-label">
                Page {page} / {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages || loading}
                onClick={() => setPage((p) => p + 1)}
                data-testid="next-page-btn"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm" data-testid="logs-error">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="logs-table">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Time</th>
                  <th className="text-left px-4 py-2 font-medium">Action</th>
                  <th className="text-left px-4 py-2 font-medium">Actor</th>
                  <th className="text-left px-4 py-2 font-medium">Resource</th>
                  <th className="text-left px-4 py-2 font-medium">Source</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Loading audit logs…
                    </td>
                  </tr>
                )}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                      data-testid="logs-empty"
                    >
                      No events match the current filters.
                    </td>
                  </tr>
                )}
                {logs.map((log) => {
                  const sev = actionSeverity(log.action, log.success);
                  return (
                    <tr
                      key={log._id}
                      onClick={() => setSelected(log)}
                      className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      data-testid={`log-row-${log._id}`}
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap text-gray-700 font-mono text-xs">
                        {fmtTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono border ${severityStyles(sev)}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-gray-900 font-medium">
                          {log.actorName || (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                        {log.actorRole && (
                          <div className="text-xs text-gray-500">
                            {log.actorRole}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-gray-800">{log.resourceType}</div>
                        {log.resourceId && (
                          <div className="font-mono text-xs text-gray-500 truncate max-w-[180px]">
                            {log.resourceId}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-xs font-mono text-gray-700">
                          {log.requestMeta?.ip || '—'}
                        </div>
                        {log.requestMeta?.method && log.requestMeta?.path && (
                          <div className="text-xs text-gray-500 truncate max-w-[240px]">
                            {log.requestMeta.method} {log.requestMeta.path}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={log.success ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {log.success ? 'Success' : 'Failed'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail drawer */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex justify-end"
          onClick={() => setSelected(null)}
          data-testid="log-detail-drawer"
        >
          <div
            className="w-full max-w-xl h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-5 py-3 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-lg">Event Details</h2>
                <p className="text-xs text-gray-500 font-mono">{selected._id}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelected(null)}
                data-testid="close-detail-btn"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-5 space-y-5">
              <div
                className={`rounded-lg border p-3 ${severityStyles(actionSeverity(selected.action, selected.success))}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-sm">
                    {selected.action}
                  </span>
                  <Badge
                    variant={selected.success ? 'secondary' : 'destructive'}
                  >
                    {selected.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
                <p className="text-xs mt-1">{fmtTime(selected.createdAt)}</p>
              </div>

              <DetailSection title="Actor">
                <DetailRow label="Name" value={selected.actorName || '—'} />
                <DetailRow label="Email" value={selected.actorEmail || '—'} />
                <DetailRow label="Role" value={selected.actorRole || '—'} />
                <DetailRow
                  label="ID"
                  value={selected.actorId || '—'}
                  mono
                  copyable={!!selected.actorId}
                />
              </DetailSection>

              <DetailSection title="Resource">
                <DetailRow label="Type" value={selected.resourceType} />
                <DetailRow
                  label="ID"
                  value={selected.resourceId || '—'}
                  mono
                  copyable={!!selected.resourceId}
                />
              </DetailSection>

              <DetailSection title="Request">
                <DetailRow
                  label="IP"
                  value={selected.requestMeta?.ip || '—'}
                  mono
                />
                <DetailRow
                  label="Method"
                  value={selected.requestMeta?.method || '—'}
                />
                <DetailRow
                  label="Path"
                  value={selected.requestMeta?.path || '—'}
                  mono
                />
                <DetailRow
                  label="User Agent"
                  value={selected.requestMeta?.userAgent || '—'}
                  small
                />
                <DetailRow
                  label="Request ID"
                  value={selected.requestMeta?.requestId || '—'}
                  mono
                  copyable={!!selected.requestMeta?.requestId}
                />
              </DetailSection>

              {selected.metadata != null && (
                <DetailSection title="Metadata">
                  <pre className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-xs overflow-auto max-h-60">
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </DetailSection>
              )}

              <DetailSection title="Integrity (hash chain)">
                <DetailRow
                  label="Hash"
                  value={selected.hash || '—'}
                  mono
                  small
                  copyable={!!selected.hash}
                />
                <DetailRow
                  label="Previous"
                  value={selected.previousHash || '—'}
                  mono
                  small
                  copyable={!!selected.previousHash}
                />
                <p className="text-xs text-gray-500 pt-1">
                  Each record is SHA-256 hashed and chained to the previous
                  event — any tampering breaks the chain.
                </p>
              </DetailSection>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  small,
  copyable,
}: {
  label: string;
  value: string;
  mono?: boolean;
  small?: boolean;
  copyable?: boolean;
}) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 items-start text-sm">
      <span className="text-gray-500">{label}</span>
      <div className="flex items-start gap-2 min-w-0">
        <span
          className={`${mono ? 'font-mono' : ''} ${small ? 'text-xs break-all' : 'break-words'} text-gray-900 dark:text-gray-100`}
        >
          {value}
        </span>
        {copyable && value !== '—' && <CopyButton value={value} label={label} />}
      </div>
    </div>
  );
}
