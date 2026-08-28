# India Location Master Data

The `work_locations` table uses a hierarchical model:

- `STATE` -> parent is null
- `DISTRICT` -> parent is the STATE id
- `CITY` -> parent is the DISTRICT id

## Source

Populate State/District master data from the Government of India's Local Government Directory (LGD): https://lgdirectory.gov.in/

Do not paste a manually maintained nationwide list into a migration. LGD data changes over time.

## Import format

Prepare a UTF-8 CSV with these columns:

```text
stateCode,stateName,districtCode,districtName,cityCode,cityName
```

`cityCode`/`cityName` are optional if the source contains only State/District data.

## Requirements

The importer must be idempotent and use `code` as the stable key. Existing records must not be duplicated. Existing Tamil Nadu locations must be preserved and reconciled by code/name before new records are inserted.

## Recommended rollout

1. Download the latest State/District data from LGD.
2. Normalize names/codes without changing source codes.
3. Load State records.
4. Load District records using State `parentId`.
5. Load City records using District `parentId` when city data is available.
6. Verify counts and orphan records.
7. Only then enable the complete dataset in production.
