import zipfile
import os
from xml.etree import ElementTree as ET

folder = 'Formato Excel'
files = [f for f in os.listdir(folder) if f.endswith('.xlsx')]
print('files=', files)
for f in files:
    path = os.path.join(folder, f)
    print('\n---', f)
    with zipfile.ZipFile(path, 'r') as z:
        names = z.namelist()
        sheets = [n for n in names if n.startswith('xl/worksheets/sheet')]
        print('sheets', sheets)
        if 'xl/workbook.xml' in names:
            wb = ET.fromstring(z.read('xl/workbook.xml'))
            ns = {'ns':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            sheet_names = [s.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id', s.attrib.get('name')) for s in wb.findall('.//ns:sheets/ns:sheet', ns)]
            print('sheet names', sheet_names)
        for sheet in sheets[:1]:
            data = z.read(sheet)
            root = ET.fromstring(data)
            ns = {'ns':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            rows = root.findall('.//ns:row', ns)
            print('row count', len(rows))
            for i, row in enumerate(rows[:20], 1):
                cells = []
                for c in row.findall('ns:c', ns):
                    v = c.find('ns:v', ns)
                    t = c.attrib.get('t')
                    txt = v.text if v is not None else ''
                    cells.append((c.attrib.get('r'), t, txt))
                print(i, cells)
            merges = root.find('ns:mergeCells', ns)
            if merges is not None:
                print('merges', [m.attrib['ref'] for m in merges.findall('ns:mergeCell', ns)])
