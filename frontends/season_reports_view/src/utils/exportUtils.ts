import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, HeadingLevel, AlignmentType } from 'docx';
import { format } from 'date-fns';
import { User, Report } from '../types';

interface DeputyData {
  user: User;
  latestReport: Report | null;
}

interface GroupedData {
  region: string;
  deputies: DeputyData[];
}

const getAbbreviatedLevel = (level: string) => {
  if (level === 'Государственная дума Федерального собрания Российской Федерации') return 'ГД';
  if (level === 'Совет Федерации Федерального собрания Российской Федерации') return 'СФ';
  if (level === 'Законодательное собрание') return 'ЗС';
  return level;
};

const getDisplayName = (user: User) => {
  const form = user.deputyForm;
  return form ? `${form.lastName} ${form.firstName} ${form.middleName || ''}`.trim() : user.login;
};

export const exportToZip = async (groupedData: GroupedData[], onProgress?: (current: number, total: number) => void) => {
  const zip = new JSZip();
  let totalFiles = 0;
  let downloadedFiles = 0;

  // Count total files to download
  for (const group of groupedData) {
    for (const deputy of group.deputies) {
      if (deputy.latestReport && deputy.latestReport.report_link) {
        totalFiles++;
      }
    }
  }

  if (totalFiles === 0) {
    if (onProgress) onProgress(0, 0);
    return;
  }

  for (const group of groupedData) {
    const regionFolder = zip.folder(group.region);
    if (!regionFolder) continue;

    for (const deputy of group.deputies) {
      if (deputy.latestReport && deputy.latestReport.report_link) {
        try {
          const response = await fetch(deputy.latestReport.report_link);
          if (response.ok) {
            const blob = await response.blob();
            const displayName = getDisplayName(deputy.user);
            const fileName = `Отчет_${displayName}_${group.region}.pdf`;
            regionFolder.file(fileName, blob);
          }
        } catch (error) {
          console.error(`Failed to download report for ${getDisplayName(deputy.user)}`, error);
        } finally {
          downloadedFiles++;
          if (onProgress) onProgress(downloadedFiles, totalFiles);
        }
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `Отчеты_депутатов_${format(new Date(), 'dd.MM.yyyy')}.zip`);
};

export const exportToExcel = async (groupedData: GroupedData[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Отчеты');

  worksheet.columns = [
    { header: '№', key: 'index', width: 5 },
    { header: 'ФИО депутата', key: 'name', width: 40 },
    { header: 'Роль В РО', key: 'role', width: 20 },
    { header: 'Уровень', key: 'level', width: 15 },
    { header: 'Дата публикации', key: 'date', width: 15 },
    { header: 'Статус', key: 'status', width: 15 },
  ];

  // Make header bold
  worksheet.getRow(1).font = { bold: true };

  groupedData.forEach((group) => {
    // Add region header row
    const regionRow = worksheet.addRow([group.region]);
    regionRow.font = { bold: true, size: 14 };
    worksheet.mergeCells(`A${regionRow.number}:F${regionRow.number}`);

    // Sort deputies: submitted first, then not submitted
    const submitted = group.deputies.filter(d => d.latestReport);
    const notSubmitted = group.deputies.filter(d => !d.latestReport);

    let index = 1;
    submitted.forEach(deputy => {
      const form = deputy.user.deputyForm;
      worksheet.addRow({
        index: index++,
        name: getDisplayName(deputy.user),
        role: form?.partyRole || '-',
        level: getAbbreviatedLevel(form?.representativeBodyLevel || '-'),
        date: deputy.latestReport ? format(new Date(deputy.latestReport.created_at), 'dd.MM.yyyy') : '-',
        status: 'Сдал'
      });
    });

    notSubmitted.forEach(deputy => {
      const form = deputy.user.deputyForm;
      const row = worksheet.addRow({
        index: index++,
        name: getDisplayName(deputy.user),
        role: form?.partyRole || '-',
        level: getAbbreviatedLevel(form?.representativeBodyLevel || '-'),
        date: '-',
        status: 'Не сдал'
      });
      // Make the row text red
      row.eachCell((cell) => {
        cell.font = { color: { argb: 'FFFF0000' } };
      });
    });
    
    // Add empty row between regions
    worksheet.addRow([]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Отчеты_депутатов_${format(new Date(), 'dd.MM.yyyy')}.xlsx`);
};

export const exportToDocx = async (groupedData: GroupedData[]) => {
  const children: any[] = [];

  children.push(
    new Paragraph({
      text: "Отчеты депутатов",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    })
  );

  groupedData.forEach((group) => {
    children.push(
      new Paragraph({
        text: group.region,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    const tableRows = [];

    // Header Row
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "№", style: "Strong" })], width: { size: 5, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: "ФИО депутата", style: "Strong" })], width: { size: 35, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: "Роль В РО", style: "Strong" })], width: { size: 20, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: "Уровень", style: "Strong" })], width: { size: 15, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: "Дата публикации", style: "Strong" })], width: { size: 15, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: "Статус", style: "Strong" })], width: { size: 10, type: WidthType.PERCENTAGE } }),
        ],
      })
    );

    const submitted = group.deputies.filter(d => d.latestReport);
    const notSubmitted = group.deputies.filter(d => !d.latestReport);

    let index = 1;

    submitted.forEach(deputy => {
      const form = deputy.user.deputyForm;
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(index.toString())] }),
            new TableCell({ children: [new Paragraph(getDisplayName(deputy.user))] }),
            new TableCell({ children: [new Paragraph(form?.partyRole || '-')] }),
            new TableCell({ children: [new Paragraph(getAbbreviatedLevel(form?.representativeBodyLevel || '-'))] }),
            new TableCell({ children: [new Paragraph(deputy.latestReport ? format(new Date(deputy.latestReport.created_at), 'dd.MM.yyyy') : '-')] }),
            new TableCell({ children: [new Paragraph("Сдал")] }),
          ],
        })
      );
      index++;
    });

    notSubmitted.forEach(deputy => {
      const form = deputy.user.deputyForm;
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: index.toString(), color: "FF0000" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: getDisplayName(deputy.user), color: "FF0000" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: form?.partyRole || '-', color: "FF0000" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: getAbbreviatedLevel(form?.representativeBodyLevel || '-'), color: "FF0000" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '-', color: "FF0000" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Не сдал", color: "FF0000" })] })] }),
          ],
        })
      );
      index++;
    });

    children.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Отчеты_депутатов_${format(new Date(), 'dd.MM.yyyy')}.docx`);
};
