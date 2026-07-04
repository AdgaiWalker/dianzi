interface ArticleFeedbackPanelProps {
  reportOpen: boolean;
  reportReason: string;
  changeOpen: boolean;
  changeNote: string;
  onReportReasonChange: (value: string) => void;
  onChangeNoteChange: (value: string) => void;
  onSubmitReport: () => void;
  onSubmitChange: () => void;
}

export function ArticleFeedbackPanel({
  reportOpen,
  reportReason,
  changeOpen,
  changeNote,
  onReportReasonChange,
  onChangeNoteChange,
  onSubmitReport,
  onSubmitChange,
}: ArticleFeedbackPanelProps) {
  return (
    <>
      {reportOpen && (
        <div className="mt-5 rounded-xl border border-border-light bg-bg-subtle p-4">
          <textarea
            value={reportReason}
            onChange={(event) => onReportReasonChange(event.target.value)}
            placeholder="请说明举报原因"
            className="h-20 w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-sage"
          />
          <button onClick={onSubmitReport} className="mt-2 rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white">
            提交举报
          </button>
        </div>
      )}

      {changeOpen && (
        <div className="mt-4 rounded-xl border border-border-light bg-bg-subtle p-4">
          <input
            value={changeNote}
            onChange={(event) => onChangeNoteChange(event.target.value)}
            placeholder="什么变了？"
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-sage"
          />
          <button onClick={onSubmitChange} className="mt-3 rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white">
            提交反馈
          </button>
        </div>
      )}
    </>
  );
}
