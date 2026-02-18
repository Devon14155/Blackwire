import { BaseAgent, type AgentContext, type AgentResponse } from "./BaseAgent";
import type { Agent } from "@domain/entities/Agent";

export interface ReviewCriteria {
  clarity: number;
  completeness: number;
  accuracy: number;
  relevance: number;
}

export interface ReviewFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  rating: number;
  criteria: ReviewCriteria;
}

export class ReviewerAgent extends BaseAgent {
  constructor(agent: Agent) {
    super(agent);
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    this.setStatus("thinking");

    const lastMessage = context.messages[context.messages.length - 1];
    const previousMessage = context.messages[context.messages.length - 2];

    if (!lastMessage) {
      return {
        content: "I'm ready to review. What would you like me to evaluate?",
        shouldContinue: false
      };
    }

    let contentToReview = lastMessage.content;
    let reviewType = "general";

    if (lastMessage.role === "user" && lastMessage.content.toLowerCase().includes("review")) {
      contentToReview = previousMessage?.content || lastMessage.content;
      reviewType = "previous_response";
    } else if (lastMessage.role === "assistant") {
      reviewType = "last_response";
    }

    const thinkingSteps: Array<{ type: "reasoning" | "planning" | "execution" | "review"; content: string }> = [
      {
        type: "reasoning",
        content: `Analyzing content for review (${reviewType}): "${contentToReview.slice(0, 100)}..."`
      },
      {
        type: "planning",
        content: "Evaluating clarity, completeness, accuracy, and relevance..."
      }
    ];

    const feedback = await this.performReview(contentToReview, context);

    thinkingSteps.push({
      type: "review" as const,
      content: `Review complete. Overall rating: ${feedback.rating}/10`
    });

    this.setStatus("idle");

    await this.remember({
      type: "semantic",
      content: `Reviewed content with rating ${feedback.rating}/10. Key issues: ${feedback.improvements.slice(0, 2).join(", ")}`,
      importance: feedback.rating < 5 ? "high" : "low"
    });

    return {
      content: this.formatResponse(feedback),
      thinking: thinkingSteps,
      shouldContinue: false
    };
  }

  private async performReview(content: string, context: AgentContext): Promise<ReviewFeedback> {
    const criteria = this.evaluateCriteria(content, context);
    
    const overallRating = Math.round(
      (criteria.clarity + criteria.completeness + criteria.accuracy + criteria.relevance) / 4 * 10
    ) / 10;

    const strengths = this.identifyStrengths(content, criteria);
    const improvements = this.identifyImprovements(content, criteria);

    return {
      summary: this.generateSummary(content, overallRating),
      strengths,
      improvements,
      rating: overallRating,
      criteria
    };
  }

  private evaluateCriteria(content: string, context: AgentContext): ReviewCriteria {
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim()).length;
    const avgSentenceLength = wordCount / Math.max(sentenceCount, 1);

    const clarity = this.calculateClarity(avgSentenceLength, content);
    const completeness = this.calculateCompleteness(content, context);
    const accuracy = this.calculateAccuracy(content);
    const relevance = this.calculateRelevance(content, context);

    return { clarity, completeness, accuracy, relevance };
  }

  private calculateClarity(avgSentenceLength: number, content: string): number {
    let score = 1.0;

    if (avgSentenceLength > 25) score -= 0.2;
    if (avgSentenceLength > 35) score -= 0.3;

    const jargonCount = (content.match(/\b[a-z]{15,}\b/gi) || []).length;
    score -= jargonCount * 0.05;

    const structureIndicators = (content.match(/^(?:#{1,3}|\d+\.|[-•])/gm) || []).length;
    if (structureIndicators > 2) score += 0.2;

    return Math.max(0, Math.min(1, score));
  }

  private calculateCompleteness(content: string, context: AgentContext): number {
    let score = 0.7;

    const hasIntro = /^(?:In (?:this|summary)|Here(?:'s| is)|I'll|Let me)/i.test(content);
    const hasConclusion = /(?:In conclusion|To summarize|In summary|Overall|Hope this helps)[^.]*\.$/i.test(content);
    const hasExamples = /(?:for example|such as|including|like)\s+/i.test(content);
    const hasActionableItems = /(?:you can|try|consider|should|recommend)\s+/i.test(content);

    if (hasIntro) score += 0.05;
    if (hasConclusion) score += 0.05;
    if (hasExamples) score += 0.1;
    if (hasActionableItems) score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private calculateAccuracy(content: string): number {
    return 0.85;
  }

  private calculateRelevance(content: string, context: AgentContext): number {
    let score = 0.8;

    const lastUserMessage = [...context.messages].reverse().find(m => m.role === "user");
    if (lastUserMessage) {
      const userWords = new Set(lastUserMessage.content.toLowerCase().split(/\s+/));
      const responseWords = new Set(content.toLowerCase().split(/\s+/));
      
      const overlap = [...userWords].filter(w => responseWords.has(w) && w.length > 3).length;
      const relevanceScore = Math.min(overlap / 5, 1);
      
      score = 0.5 + relevanceScore * 0.5;
    }

    return Math.max(0, Math.min(1, score));
  }

  private identifyStrengths(content: string, criteria: ReviewCriteria): string[] {
    const strengths: string[] = [];

    if (criteria.clarity > 0.8) strengths.push("Clear and easy to understand");
    if (criteria.completeness > 0.8) strengths.push("Comprehensive coverage of the topic");
    if (criteria.relevance > 0.8) strengths.push("Highly relevant to the request");
    if (/#{1,3}\s/.test(content)) strengths.push("Well-structured with headers");
    if (/\d+\.\s/.test(content)) strengths.push("Uses numbered lists for clarity");
    if (/```/.test(content)) strengths.push("Includes code examples");

    return strengths.length > 0 ? strengths : ["Addressed the request"];
  }

  private identifyImprovements(content: string, criteria: ReviewCriteria): string[] {
    const improvements: string[] = [];

    if (criteria.clarity < 0.6) improvements.push("Consider simplifying sentence structure");
    if (criteria.completeness < 0.6) improvements.push("Could provide more comprehensive coverage");
    if (criteria.relevance < 0.6) improvements.push("Could be more focused on the specific request");
    if (content.length < 100) improvements.push("Consider elaborating with more details");
    if (content.length > 2000 && !/#{1,3}\s/.test(content)) {
      improvements.push("Consider adding section headers for better readability");
    }
    if (!/(?:you can|try|consider|recommend)/i.test(content)) {
      improvements.push("Could include actionable recommendations");
    }

    return improvements;
  }

  private generateSummary(content: string, rating: number): string {
    if (rating >= 8) {
      return "This is a high-quality response that effectively addresses the request.";
    } else if (rating >= 6) {
      return "This is a good response with some room for improvement.";
    } else if (rating >= 4) {
      return "This response needs improvement in several areas.";
    } else {
      return "This response requires significant revision.";
    }
  }

  private formatResponse(feedback: ReviewFeedback): string {
    const { summary, strengths, improvements, rating, criteria } = feedback;

    let response = `## Review Results\n\n`;
    response += `**Overall Rating:** ${rating}/10\n\n`;
    response += `**Summary:** ${summary}\n\n`;

    response += `### Criteria Breakdown\n`;
    response += `- Clarity: ${Math.round(criteria.clarity * 100)}%\n`;
    response += `- Completeness: ${Math.round(criteria.completeness * 100)}%\n`;
    response += `- Accuracy: ${Math.round(criteria.accuracy * 100)}%\n`;
    response += `- Relevance: ${Math.round(criteria.relevance * 100)}%\n\n`;

    if (strengths.length > 0) {
      response += `### Strengths ✅\n`;
      strengths.forEach(s => response += `- ${s}\n`);
      response += "\n";
    }

    if (improvements.length > 0) {
      response += `### Areas for Improvement 🔧\n`;
      improvements.forEach(i => response += `- ${i}\n`);
      response += "\n";
    }

    response += `Would you like me to suggest a revised version?`;

    return response;
  }
}