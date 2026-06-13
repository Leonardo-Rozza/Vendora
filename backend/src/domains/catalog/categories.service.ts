import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
};

export type CategoryNode = CategorySummary & { children: CategoryNode[] };

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  listAll(): Promise<CategorySummary[]> {
    return this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async getTree(): Promise<CategoryNode[]> {
    return buildCategoryTree(await this.listAll());
  }

  /** Ids of the category with `slug` plus all of its descendants. */
  async resolveBranchIds(slug: string): Promise<string[]> {
    return collectBranchIds(await this.listAll(), slug);
  }
}

/** Builds a nested tree from a flat, parent-referencing category list. */
export function buildCategoryTree(
  categories: CategorySummary[],
): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>();

  for (const category of categories) {
    nodes.set(category.id, { ...category, children: [] });
  }

  const roots: CategoryNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/** Collects the id of `slug` and every descendant (BFS). */
export function collectBranchIds(
  categories: CategorySummary[],
  slug: string,
): string[] {
  const root = categories.find((category) => category.slug === slug);

  if (!root) {
    return [];
  }

  const childrenByParent = new Map<string, CategorySummary[]>();

  for (const category of categories) {
    if (!category.parentId) {
      continue;
    }

    const siblings = childrenByParent.get(category.parentId) ?? [];
    siblings.push(category);
    childrenByParent.set(category.parentId, siblings);
  }

  const ids: string[] = [];
  const queue = [root.id];

  while (queue.length > 0) {
    const id = queue.shift() as string;
    ids.push(id);

    for (const child of childrenByParent.get(id) ?? []) {
      queue.push(child.id);
    }
  }

  return ids;
}
