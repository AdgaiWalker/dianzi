import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client";
import {
  ideas,
  ideaStructures,
  ideaReactions,
  ideaResponses,
  ideaEdges,
  users,
} from "../../db/schema";
import type { SaveStructuredIdeaInput } from "./types";

export async function createRawIdea(
  userId: number | null,
  rawInput: string,
  sourceType: string,
  visibility: string = "public",
  allowCollaboration: boolean = true
) {
  if (!db) {
    throw new Error("Database is not connected");
  }

  const [row] = await db
    .insert(ideas)
    .values({
      userId,
      rawInput,
      sourceType,
      visibility,
      status: "thinking",
      allowCollaboration,
      gravityScore: 0,
      safetyStatus: "passed", // Default passed for V1/mock setup
    })
    .returning();

  return row;
}

export async function findIdeaById(id: number) {
  if (!db) return null;

  const [ideaRow] = await db
    .select()
    .from(ideas)
    .where(eq(ideas.id, id));

  if (!ideaRow) return null;

  const [structureRow] = await db
    .select()
    .from(ideaStructures)
    .where(eq(ideaStructures.ideaId, id));

  return {
    ...ideaRow,
    structure: structureRow || null,
  };
}

export async function saveStructuredResult(ideaId: number, input: SaveStructuredIdeaInput) {
  if (!db) {
    throw new Error("Database is not connected");
  }

  // Update the main ideas table
  await db
    .update(ideas)
    .set({
      title: input.title,
      summary: input.summary,
      status: "waiting_response", // wait for response
      updatedAt: new Date(),
    })
    .where(eq(ideas.id, ideaId));

  // Insert or update structured results in idea_structures
  const [existing] = await db
    .select()
    .from(ideaStructures)
    .where(eq(ideaStructures.ideaId, ideaId));

  if (existing) {
    const [row] = await db
      .update(ideaStructures)
      .set({
        structuredTitle: input.title,
        oneSentence: input.summary,
        problem: input.aiStructure.problem,
        targetUsers: input.aiStructure.targetUsers,
        possibleSolutions: input.aiStructure.possibleSolutions,
        validationSteps: input.aiStructure.validationSteps,
        risks: input.aiStructure.risks,
        tags: input.tags,
        updatedAt: new Date(),
      })
      .where(eq(ideaStructures.ideaId, ideaId))
      .returning();
    return row;
  } else {
    const [row] = await db
      .insert(ideaStructures)
      .values({
        ideaId,
        structuredTitle: input.title,
        oneSentence: input.summary,
        problem: input.aiStructure.problem,
        targetUsers: input.aiStructure.targetUsers,
        possibleSolutions: input.aiStructure.possibleSolutions,
        validationSteps: input.aiStructure.validationSteps,
        risks: input.aiStructure.risks,
        tags: input.tags,
      })
      .returning();
    return row;
  }
}

export async function queryIdeas(sort?: string, tag?: string) {
  if (!db) return [];

  const baseQuery = db.select().from(ideas).where(eq(ideas.visibility, "public"));

  const rows = sort === "gravity"
    ? await baseQuery.orderBy(desc(ideas.gravityScore))
    : await baseQuery.orderBy(desc(ideas.createdAt));

  // Retrieve structure details for each idea
  const results = [];
  for (const idea of rows) {
    const [structure] = await db
      .select()
      .from(ideaStructures)
      .where(eq(ideaStructures.ideaId, idea.id));

    // Filter by tag locally if tag query is provided
    if (tag && structure && !structure.tags.includes(tag)) {
      continue;
    }

    results.push({
      ...idea,
      tags: structure ? structure.tags : [],
      aiStructure: structure
        ? {
            problem: structure.problem,
            targetUsers: structure.targetUsers,
            possibleSolutions: structure.possibleSolutions,
            validationSteps: structure.validationSteps,
            risks: structure.risks,
          }
        : undefined,
    });
  }

  return results;
}

export async function createReaction(ideaId: number, userId: number, reactionType: string) {
  if (!db) {
    throw new Error("Database is not connected");
  }

  const [row] = await db
    .insert(ideaReactions)
    .values({
      ideaId,
      userId,
      reactionType,
    })
    .returning();

  // Increment gravity score
  const scoreInc = reactionType === "can_help" ? 10 : 3;
  await db
    .update(ideas)
    .set({
      gravityScore: sql`${ideas.gravityScore} + ${scoreInc}`,
    })
    .where(eq(ideas.id, ideaId));

  return row;
}

export async function createResponse(
  ideaId: number,
  userId: number,
  responseType: string,
  content: string,
  linkedIdeaId?: number
) {
  if (!db) {
    throw new Error("Database is not connected");
  }

  const [row] = await db
    .insert(ideaResponses)
    .values({
      ideaId,
      userId,
      responseType,
      content,
      linkedIdeaId,
    })
    .returning();

  // Increment gravity score by 5 for discussions
  await db
    .update(ideas)
    .set({
      gravityScore: sql`${ideas.gravityScore} + 5`,
    })
    .where(eq(ideas.id, ideaId));

  return row;
}
