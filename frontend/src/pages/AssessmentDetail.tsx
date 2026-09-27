import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";

export default function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/assessments/${id}`).then((r) => setAssessment(r.data.data.assessment)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!assessment) return <p className="text-sm text-red-600">Assessment not found.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Assessment Detail</h1>
      <div className="space-y-4">
        {assessment.attempts?.map((attempt: any) => {
          const feedback = attempt.evaluationFeedback?.[0];
          const score = feedback?.scoreAdjusted ?? attempt.scoreRaw;
          return (
            <div key={attempt.id} className="bg-white rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-gray-900">{attempt.question?.stem}</p>
                {score !== null && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${score >= 0.75 ? "bg-green-100 text-green-700" : score >= 0.4 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                    {Math.round(score * 100)}%
                  </span>
                )}
              </div>
              {attempt.responseText && (
                <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">{attempt.responseText}</p>
              )}
              {feedback && (
                <div className="space-y-2 text-xs">
                  {feedback.strengths?.length > 0 && (
                    <div>
                      <span className="font-medium text-green-700">Strengths: </span>
                      <span className="text-gray-700">{feedback.strengths.join(", ")}</span>
                    </div>
                  )}
                  {feedback.gaps?.length > 0 && (
                    <div>
                      <span className="font-medium text-amber-700">Gaps: </span>
                      <span className="text-gray-700">{feedback.gaps.join(", ")}</span>
                    </div>
                  )}
                  {feedback.suggestedRemediation && (
                    <p className="text-gray-600 italic">{feedback.suggestedRemediation}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
