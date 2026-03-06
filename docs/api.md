# ProofAid MVP API

Base URL: `http://localhost:4000`

## Create Program

`POST /program`

```json
{
  "name": "School Nutrition Program",
  "description": "Meal support for children",
  "budget": 50000
}
```

## Register Beneficiary

`POST /beneficiary`

```json
{
  "programId": "program_xxx",
  "name": "Jane Doe",
  "birthdate": "2013-08-20",
  "region": "Da Nang"
}
```

## Issue Voucher

`POST /voucher`

```json
{
  "programId": "program_xxx",
  "beneficiaryId": "beneficiary_xxx",
  "aidType": "nutrition",
  "value": 5,
  "expiryDays": 30
}
```

## Redeem Voucher

`POST /redeem`

```json
{
  "voucherId": "voucher_xxx"
}
```

## Offline Queue Upload

`POST /offline/queue`

```json
{
  "transactions": [
    {
      "action": "REDEEM",
      "payload": { "voucherId": "voucher_xxx" }
    }
  ]
}
```

## Offline Sync

`POST /offline/sync`

Executes queued actions and records ledger events.
