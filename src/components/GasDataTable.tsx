import { GasReading, getStatusBgClass } from '@/data/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface GasDataTableProps {
  data: GasReading[];
}

const GasDataTable = ({ data }: GasDataTableProps) => {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-card hover:bg-card border-border">
            <TableHead className="font-bold text-foreground">ID</TableHead>
            <TableHead className="font-bold text-foreground">TIMESTAMP</TableHead>
            <TableHead className="font-bold text-foreground text-right">CO2 (PPM)</TableHead>
            <TableHead className="font-bold text-foreground text-right">CO (PPM)</TableHead>
            <TableHead className="font-bold text-foreground text-right">LPG (PPM)</TableHead>
            <TableHead className="font-bold text-foreground text-right">H2S (PPM)</TableHead>
            <TableHead className="font-bold text-foreground text-center">STATUS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((reading) => (
            <TableRow 
              key={reading.id} 
              className="border-border hover:bg-muted/50 transition-colors"
            >
              <TableCell className="font-mono text-primary">{reading.id}</TableCell>
              <TableCell className="font-mono text-muted-foreground text-sm">
                {reading.timestamp}
              </TableCell>
              <TableCell className="data-cell text-right">{reading.co2.toFixed(1)}</TableCell>
              <TableCell className="data-cell text-right">{reading.co.toFixed(1)}</TableCell>
              <TableCell className="data-cell text-right">{reading.lpg.toFixed(1)}</TableCell>
              <TableCell className="data-cell text-right">{reading.h2s.toFixed(2)}</TableCell>
              <TableCell className="text-center">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBgClass(reading.status)}`}>
                  {reading.status.toUpperCase()}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default GasDataTable;
