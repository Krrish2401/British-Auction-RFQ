type ActivityLogEntry = {
    id: string;
    occurredAt: string;
    description: string;
};

export function ActivityLog({ logs }: { logs: ActivityLogEntry[] }) {
    return (
        <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
            {logs.length === 0 ? <p className="text-sm text-slate-600">No activity yet.</p> : null}
            <div className="space-y-3">
                {logs.map((log) => (
                    <div key={log.id} className="border-b border-slate-100 pb-2">
                        <p className="text-xs text-slate-500">{new Date(log.occurredAt).toLocaleString()}</p>
                        <p className="text-sm text-slate-800">{log.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
