import styles from './HwTable.module.css';

interface ChildrenProps {
  children: React.ReactNode;
  className?: string;
}

export function HwTable({ children, className }: ChildrenProps) {
  return (
    <table className={[styles.table, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </table>
  );
}

export function HwTableHead({ children, className }: ChildrenProps) {
  return <thead className={className}>{children}</thead>;
}

export function HwTableBody({ children, className }: ChildrenProps) {
  return <tbody className={className}>{children}</tbody>;
}

interface HwTableRowProps extends ChildrenProps {
  header?: boolean;
}

export function HwTableRow({ children, className, header = false }: HwTableRowProps) {
  const classes = [
    styles.row,
    header ? styles.rowHeader : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <tr className={classes}>{children}</tr>;
}

export function HwTableHeader({ children, className }: ChildrenProps) {
  return (
    <th className={[styles.th, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </th>
  );
}

interface HwTableCellProps extends ChildrenProps {
  strong?: boolean;
  numeric?: boolean;
  positive?: boolean;
  negative?: boolean;
}

export function HwTableCell({
  children,
  className,
  strong = false,
  numeric = false,
  positive = false,
  negative = false,
}: HwTableCellProps) {
  const classes = [
    styles.td,
    strong ? styles.tdStrong : '',
    numeric ? styles.tdNumeric : '',
    positive ? styles.tdPositive : '',
    negative ? styles.tdNegative : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <td className={classes}>{children}</td>;
}
