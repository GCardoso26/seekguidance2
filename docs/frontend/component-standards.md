# Component Standards — JudgeTCG

## Button

```tsx
import { Button } from "@/components/ui/button";

<Button>Primário</Button>
<Button variant="outline">Secundário</Button>
<Button variant="ghost" size="icon"><Icon /></Button>
<Button loading>Salvando...</Button>
```

| Variant | Uso |
|---------|-----|
| `default` | CTA principal |
| `secondary` | Ação secundária |
| `outline` | Cancelar, alternativas |
| `ghost` | Toolbar, icon buttons |
| `danger` | Excluir, ações destrutivas |

## Card / Surface

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Surface } from "@/components/ui/surface";

<Card variant="interactive" padding="md">...</Card>
<Surface variant="elevated">KPI</Surface>
```

Variants Card: `default` · `elevated` · `muted` · `interactive` · `ghost`

## Badge

```tsx
<Badge>Novo</Badge>
<Badge variant="success">Ativo</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="danger">Esgotado</Badge>
```

## Input

```tsx
import { FormField, Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<FormField>
  <Label htmlFor="name">Nome</Label>
  <Input id="name" placeholder="..." />
</FormField>
```

## DataTable

```tsx
import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell } from "@/components/ui/data-table";

<DataTable stickyHeader density="comfortable">
  <DataTableHeader>
    <tr>
      <DataTableHead>Produto</DataTableHead>
      <DataTableHead>Preço</DataTableHead>
    </tr>
  </DataTableHeader>
  <DataTableBody>
    <DataTableRow>
      <DataTableCell>Card X</DataTableCell>
      <DataTableCell>R$ 12,00</DataTableCell>
    </DataTableRow>
  </DataTableBody>
</DataTable>
```

## Skeleton

```tsx
<Skeleton className="h-4 w-32" />
<SkeletonCard />
<SkeletonDashboard />
<SkeletonTableRow cols={5} />
```

## Async states

```tsx
import { PageSkeleton, PageEmpty, PageError } from "@/components/ui/async-state";
```

## Theme

```tsx
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme } from "@/providers/theme-provider";
```

## Deprecações

| Legado | Substituir por |
|--------|----------------|
| `components/luxury/ui/Button` | `components/ui/button` |
| `components/luxury/ui/Card` | `components/ui/card` ou `Surface` |
| `border-white/10 bg-white/5` | `Surface` ou `surface-card` |
| `text-luxury-gold` (novo código) | `text-primary` |
| `bg-luxury-onyx` (novo código) | `bg-background` |

## Convenções de arquivo

- Um componente por arquivo em `components/ui/`
- Variantes via CVA (`class-variance-authority`)
- `cn()` para merge de classes
- Props `className` sempre aceita override
- Sem estilos inline exceto tokens dinâmicos (cor de jogo)
