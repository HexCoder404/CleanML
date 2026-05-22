"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToastStore, createToastHelpers } from "../../store/toastStore";
import ToastContainer from "../components/ToastContainer";

interface FeedbackNode {
  id: string;
  parent_id: string | null;
  username: string;
  text: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  replies: FeedbackNode[];
}

function formatTimestamp(isoString: string) {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs < 0) {
      return "just now";
    }

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 10) return "just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return "yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch (e) {
    return isoString;
  }
}

function formatScore(score: number): string {
  const absScore = Math.abs(score);
  if (absScore >= 1000) {
    const kValue = score / 1000;
    return `${kValue.toFixed(kValue % 1 === 0 ? 0 : 1)}K`;
  }
  return score.toString();
}

function countAllReplies(comment: FeedbackNode): number {
  let count = 0;
  if (comment.replies) {
    count += comment.replies.length;
    for (const reply of comment.replies) {
      count += countAllReplies(reply);
    }
  }
  return count;
}

/* ─── Threaded Comment Component ───────────────────────────────── */
interface CommentNodeProps {
  comment: FeedbackNode;
  onReply: (parentId: string, text: string) => Promise<void>;
  onVote: (id: string, upDelta: number, downDelta: number) => Promise<void>;
  upvotedIds: Set<string>;
  downvotedIds: Set<string>;
  depth: number;
}

function CommentNode({ comment, onReply, onVote, upvotedIds, downvotedIds, depth }: CommentNodeProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isUpvoted = upvotedIds.has(comment.id);
  const isDownvoted = downvotedIds.has(comment.id);
  const score = (comment.upvotes || 0) - (comment.downvotes || 0);
  const replyCount = countAllReplies(comment);

  const handleUpvote = async () => {
    try {
      if (isUpvoted) {
        await onVote(comment.id, -1, 0);
      } else if (isDownvoted) {
        await onVote(comment.id, 1, -1);
      } else {
        await onVote(comment.id, 1, 0);
      }
    } catch (err) {
      // Error handled by parent
    }
  };

  const handleDownvote = async () => {
    try {
      if (isDownvoted) {
        await onVote(comment.id, 0, -1);
      } else if (isUpvoted) {
        await onVote(comment.id, -1, 1);
      } else {
        await onVote(comment.id, 0, 1);
      }
    } catch (err) {
      // Error handled by parent
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || replyText.length > 700) return;
    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyText);
      setReplyText("");
      setShowReplyBox(false);
      setShowReplies(true);
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="group relative mt-4">
      {/* Visual Guideline for Threaded Comments */}
      {comment.parent_id && (
        <div className="absolute -left-5 top-0 bottom-0 w-0.5 bg-gray-100 group-hover:bg-indigo-200 transition-colors" />
      )}

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 relative">
        <div className="flex items-start space-x-3.5">
          {/* Avatar Placeholder */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 font-extrabold flex items-center justify-center text-sm shadow-sm select-none border border-indigo-200/50">
            {comment.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {/* Username and Time */}
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-900 text-sm tracking-tight">{comment.username}</span>
              <span className="text-gray-400 text-[10px] select-none">•</span>
              <span className="text-gray-400 text-xs font-medium">{formatTimestamp(comment.timestamp)}</span>
            </div>

            {/* Comment Body */}
            <p className="mt-2 text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
              {comment.text}
            </p>

            {/* Actions */}
            <div className="mt-3 flex items-center space-x-3">
              {/* Reddit-style Voting Widget */}
              <div className="flex items-center bg-gray-50 border border-gray-100 rounded-full px-1.5 py-0.5 shadow-sm select-none">
                <button
                  type="button"
                  onClick={handleUpvote}
                  className={`p-1 rounded-full transition-colors ${
                    isUpvoted
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-400 hover:text-indigo-600 hover:bg-gray-100"
                  }`}
                  title={isUpvoted ? "Remove upvote" : "Upvote"}
                  aria-label="Upvote"
                >
                  <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <span className={`text-[11px] font-bold px-1.5 min-w-[16px] text-center transition-colors ${
                  isUpvoted 
                    ? "text-indigo-600" 
                    : isDownvoted 
                    ? "text-rose-600" 
                    : "text-gray-600"
                }`}>
                  {formatScore(score)}
                </span>
                <button
                  type="button"
                  onClick={handleDownvote}
                  className={`p-1 rounded-full transition-colors ${
                    isDownvoted
                      ? "text-rose-600 bg-rose-50"
                      : "text-gray-400 hover:text-rose-600 hover:bg-gray-100"
                  }`}
                  title={isDownvoted ? "Remove downvote" : "Downvote"}
                  aria-label="Downvote"
                >
                  <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Reply Trigger Button */}
              <button
                type="button"
                onClick={() => setShowReplyBox(!showReplyBox)}
                className={`text-xs font-bold flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  showReplyBox
                    ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                    : "text-indigo-600 hover:text-indigo-800 border-gray-100 hover:bg-indigo-50/50 hover:border-indigo-100/30"
                }`}
              >
                {showReplyBox ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>Reply</span>
                  </>
                )}
              </button>

              {/* Show/Hide Replies Toggle Button */}
              {replyCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowReplies(!showReplies)}
                  className={`text-xs font-bold flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    showReplies
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200/50 hover:bg-indigo-100/40"
                      : "bg-white text-gray-500 hover:text-indigo-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{showReplies ? "Hide Replies" : `Show ${replyCount} ${replyCount === 1 ? 'Reply' : 'Replies'}`}</span>
                </button>
              )}
            </div>

            {/* Inline Reply Input Box */}
            {showReplyBox && (
              <form
                onSubmit={handleSubmitReply}
                className="mt-4 bg-gray-50 border border-gray-100 p-3.5 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.username}...`}
                  rows={2}
                  maxLength={700}
                  className="w-full text-sm bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-800 placeholder-gray-400 resize-none transition-all"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${
                    replyText.length > 650 
                      ? "text-rose-500 animate-pulse" 
                      : replyText.length > 500 
                      ? "text-amber-500" 
                      : "text-gray-400"
                  }`}>
                    {replyText.length} / 700
                  </span>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReplyBox(false);
                        setReplyText("");
                      }}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !replyText.trim() || replyText.length > 700}
                      className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Posting...</span>
                        </>
                      ) : (
                        <span>Post Reply</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Recursive nested comments (Replies) */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 pl-4 border-l border-gray-100 mt-2 space-y-3">
          {comment.replies.map((reply) => (
            <CommentNode 
              key={reply.id} 
              comment={reply} 
              onReply={onReply} 
              onVote={onVote}
              upvotedIds={upvotedIds}
              downvotedIds={downvotedIds}
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page Component ──────────────────────────────────────── */
export default function FeedbackPage() {
  const toast = createToastHelpers();

  const [comments, setComments] = useState<FeedbackNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWriteBox, setShowWriteBox] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [sortBy, setSortBy] = useState<"upvotes" | "newest">("upvotes");
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());
  const [downvotedIds, setDownvotedIds] = useState<Set<string>>(new Set());

  // Load upvoted and downvoted comment IDs on mount
  useEffect(() => {
    try {
      const storedUp = localStorage.getItem("cleanml_upvoted_comments");
      if (storedUp) {
        setUpvotedIds(new Set(JSON.parse(storedUp)));
      }
      const storedDown = localStorage.getItem("cleanml_downvoted_comments");
      if (storedDown) {
        setDownvotedIds(new Set(JSON.parse(storedDown)));
      }
    } catch (e) {
      console.error("Failed to load voted IDs:", e);
    }
  }, []);

  const fetchComments = async () => {
    try {
      const res = await fetch("/api/feedback");
      if (!res.ok) throw new Error("Failed to load feedback from server");
      const data = await res.json();
      setComments(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleAddCommentOrReply = async (parentId: string | null, text: string) => {
    if (text.length > 700) {
      throw new Error("Comment exceeds the 700 character limit");
    }
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, parent_id: parentId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to submit comment");
    }

    toast.success(parentId ? "Reply posted!" : "Feedback posted!");
    await fetchComments();
  };

  const handleVote = async (id: string, upDelta: number, downDelta: number) => {
    try {
      const res = await fetch(`/api/feedback/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ up_delta: upDelta, down_delta: downDelta }),
      });
      if (!res.ok) {
        throw new Error("Failed to register vote");
      }
      
      const nextUpvoted = new Set(upvotedIds);
      const nextDownvoted = new Set(downvotedIds);
      
      if (upDelta > 0) {
        nextUpvoted.add(id);
      } else if (upDelta < 0) {
        nextUpvoted.delete(id);
      }
      
      if (downDelta > 0) {
        nextDownvoted.add(id);
      } else if (downDelta < 0) {
        nextDownvoted.delete(id);
      }
      
      setUpvotedIds(nextUpvoted);
      setDownvotedIds(nextDownvoted);
      
      localStorage.setItem("cleanml_upvoted_comments", JSON.stringify(Array.from(nextUpvoted)));
      localStorage.setItem("cleanml_downvoted_comments", JSON.stringify(Array.from(nextDownvoted)));
      
      // Optimistically adjust vote counts in UI tree
      const updateVotesInTree = (list: FeedbackNode[]): FeedbackNode[] => {
        return list.map((node) => {
          if (node.id === id) {
            return { 
              ...node, 
              upvotes: Math.max(0, (node.upvotes || 0) + upDelta),
              downvotes: Math.max(0, (node.downvotes || 0) + downDelta)
            };
          }
          if (node.replies && node.replies.length > 0) {
            return { ...node, replies: updateVotesInTree(node.replies) };
          }
          return node;
        });
      };
      
      setComments((prev) => updateVotesInTree(prev));
      toast.success("Vote registered!");
    } catch (err: any) {
      toast.error(err.message || "Failed to register vote.");
    }
  };

  const handleSubmitNewComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || newCommentText.length > 700) return;
    setIsSubmittingNew(true);
    try {
      await handleAddCommentOrReply(null, newCommentText);
      setNewCommentText("");
      setShowWriteBox(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback.");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "upvotes") {
      const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
      const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
      const scoreDiff = scoreB - scoreA;
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <ToastContainer />

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-3 text-indigo-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
          </svg>
          <span className="text-2xl font-extrabold tracking-tight">CleanML</span>
        </div>
        <div className="hidden md:flex space-x-6 text-sm font-medium text-gray-500">
          <Link href="/" className="hover:text-indigo-600 hover:border-indigo-600/50 active:text-indigo-600 active:border-indigo-600 transition-all border-b-2 border-transparent pb-1">Clean</Link>
          <Link href="/visualize" className="hover:text-indigo-600 hover:border-indigo-600/50 active:text-indigo-600 active:border-indigo-600 transition-all border-b-2 border-transparent pb-1">Visualize Data</Link>
          <Link href="/feedback" className="hover:text-indigo-600 hover:border-indigo-600/50 active:text-indigo-600 active:border-indigo-600 transition-all font-semibold text-indigo-600 border-b-2 border-indigo-600 pb-1">Feedback</Link>
          <Link href="/docs" className="hover:text-indigo-600 hover:border-indigo-600/50 active:text-indigo-600 active:border-indigo-600 transition-all border-b-2 border-transparent pb-1">Docs</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        
        {/* Header with write icon on the right */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200/60 gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Community Feedback
            </h1>
            <p className="text-gray-500 text-sm">
              Spotted an issue, have a request, or want to share ideas? Write a comment or reply to other users!
            </p>
          </div>
          
          {/* Write feedback icon at the right */}
          <button
            onClick={() => setShowWriteBox((v) => !v)}
            className={`p-3 rounded-full shadow-sm border transition-all duration-200 flex items-center justify-center shrink-0 ${
              showWriteBox
                ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 hover:scale-105"
                : "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 hover:scale-105"
            }`}
            title={showWriteBox ? "Close Form" : "Write Feedback"}
          >
            {showWriteBox ? (
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            )}
          </button>
        </header>

        {/* Top-level Comment Text Box (opens when write icon is clicked) */}
        {showWriteBox && (
          <form
            onSubmit={handleSubmitNewComment}
            className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-lg shadow-indigo-100/40 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-600"></div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Write a comment or issue</label>
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="What issue or feedback are you experiencing with CleanML?"
                rows={4}
                maxLength={700}
                className="w-full text-sm border border-gray-200 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-800 placeholder-gray-400 resize-none transition-all"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
              <span className={`text-xs font-semibold ${
                newCommentText.length > 650 
                  ? "text-rose-500 animate-pulse" 
                  : newCommentText.length > 500 
                  ? "text-amber-500" 
                  : "text-gray-400"
              }`}>
                {newCommentText.length} / 700 characters
              </span>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowWriteBox(false);
                    setNewCommentText("");
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew || !newCommentText.trim() || newCommentText.length > 700}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmittingNew ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Post Comment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Sorting Toggles */}
        {comments.length > 0 && (
          <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-3 select-none">
              Sort Threads
            </span>
            <div className="flex space-x-1.5">
              <button
                onClick={() => setSortBy("upvotes")}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center space-x-1.5 ${
                  sortBy === "upvotes"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-indigo-600 hover:bg-gray-50"
                }`}
              >
                <span>🔥</span>
                <span>Most Upvoted</span>
              </button>
              <button
                onClick={() => setSortBy("newest")}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center space-x-1.5 ${
                  sortBy === "newest"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-indigo-600 hover:bg-gray-50"
                }`}
              >
                <span>🕒</span>
                <span>Newest</span>
              </button>
            </div>
          </div>
        )}

        {/* Comment Thread List */}
        <section className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-500 font-semibold text-sm">Loading community comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl">
                💬
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-bold text-gray-900 text-lg">No comments yet</h3>
                <p className="text-gray-500 text-sm">
                  Be the first one to write what issues you are facing, or share your thoughts with the community!
                </p>
              </div>
              <button
                onClick={() => setShowWriteBox(true)}
                className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>Write Feedback</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedComments.map((comment) => (
                <CommentNode
                  key={comment.id}
                  comment={comment}
                  onReply={handleAddCommentOrReply}
                  onVote={handleVote}
                  upvotedIds={upvotedIds}
                  downvotedIds={downvotedIds}
                  depth={0}
                />
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
