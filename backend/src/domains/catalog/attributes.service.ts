import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';

export type AttributeFilter = { slug: string; values: string[] };

@Injectable()
export class AttributesService {
  constructor(private readonly prisma: PrismaService) {}

  /** All attributes with their values, for the filter sidebar and admin. */
  listAll() {
    return this.prisma.attribute.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        values: {
          orderBy: { value: 'asc' },
          select: { id: true, value: true, slug: true },
        },
      },
    });
  }
}

/**
 * Parses the compact attribute filter format
 * `color:negro,azul;material:vidrio` into structured filters.
 */
export function parseAttributeFilter(raw?: string): AttributeFilter[] {
  if (!raw) {
    return [];
  }

  const filters: AttributeFilter[] = [];

  for (const group of raw.split(';')) {
    const [slugRaw, valuesRaw] = group.split(':');
    const slug = slugRaw?.trim();

    if (!slug || !valuesRaw) {
      continue;
    }

    const values = valuesRaw
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (values.length > 0) {
      filters.push({ slug, values });
    }
  }

  return filters;
}
