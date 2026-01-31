import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';

@Injectable()
export class ImportService {
    /**
     * Parse a buffer (from a file upload) into an array of objects
     * @param buffer File buffer
     * @param filename Filename to determine the type (csv, xlsx, etc.)
     */
    async parseFile(buffer: Buffer, filename: string): Promise<any[]> {
        const extension = filename.split('.').pop()?.toLowerCase();

        if (extension === 'csv') {
            return this.parseCSV(buffer);
        } else if (['xlsx', 'xls'].includes(extension || '')) {
            return this.parseExcel(buffer);
        } else {
            throw new BadRequestException('Format de fichier non supporté. Utilisez .csv, .xls ou .xlsx');
        }
    }

    private parseCSV(buffer: Buffer): any[] {
        try {
            // Strip BOM if present
            let fileContent = buffer.toString('utf8');
            if (fileContent.charCodeAt(0) === 0xFEFF) {
                fileContent = fileContent.slice(1);
            }

            return parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                relax_column_count: true,
            });
        } catch (error) {
            throw new BadRequestException('Erreur lors de la lecture du fichier CSV: ' + error.message);
        }
    }

    private parseExcel(buffer: Buffer): any[] {
        try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            return XLSX.utils.sheet_to_json(worksheet);
        } catch (error) {
            throw new BadRequestException('Erreur lors de la lecture du fichier Excel: ' + error.message);
        }
    }

    /**
     * Validate and map data against a schema
     * @param data Raw data from file
     * @param mapping Mapping of file headers to internal fields { 'Nom': 'lastName', ... }
     */
    mapData(data: any[], mapping: Record<string, string>): any[] {
        return data.map((row) => {
            const mappedRow: any = {};
            for (const [fileHeader, internalKey] of Object.entries(mapping)) {
                mappedRow[internalKey] = row[fileHeader];
            }
            return mappedRow;
        });
    }
}
