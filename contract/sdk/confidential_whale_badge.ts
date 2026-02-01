/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/confidential_whale_badge.json`.
 */
export type ConfidentialWhaleBadge = {
  "address": "XPbon4Sw7hDArH49W8JNf5LK9nNTvowpRqWDHM2hMLD",
  "metadata": {
    "name": "confidentialWhaleBadge",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Confidential Whale Badge using Inco Lightning for encrypted tier verification"
  },
  "instructions": [
    {
      "name": "cancelPayment",
      "docs": [
        "Cancel a private payment - sender must PROVE ownership",
        "",
        "**PRIVACY PRESERVED:**",
        "- Sender proves identity by providing their encrypted hash",
        "- INCO compares: stored_encrypted_sender == provided_sender",
        "- Only TRUE match allows cancellation",
        "",
        "**NO PUBKEY VERIFICATION** - all done via encrypted comparison"
      ],
      "discriminator": [
        217,
        129,
        71,
        37,
        216,
        193,
        38,
        33
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "Caller (must prove they are original sender)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "payment",
          "docs": [
            "Payment account"
          ],
          "writable": true
        },
        {
          "name": "escrow",
          "docs": [
            "Escrow account holding the funds"
          ],
          "writable": true
        },
        {
          "name": "incoLightningProgram",
          "docs": [
            "INCO Lightning program"
          ],
          "address": "5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj"
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "encryptedSenderCiphertext",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "claimBadge",
      "docs": [
        "Claim a confidential badge - encrypts tier and pre-computes all proofs",
        "",
        "All encrypted values must be created client-side using INCO JS SDK:",
        "- requested_tier: The tier (1-5) the user wants to purchase",
        "- encrypted_tier_ciphertext: The user's tier (1-5) encrypted",
        "- encrypted_threshold_1-5: Constant values 1,2,3,4,5 encrypted",
        "",
        "**Tier Prices (admin configurable):**",
        "- Bronze (1): 0.1 SOL",
        "- Silver (2): 0.2 SOL",
        "- Gold (3): 0.3 SOL",
        "- Diamond (4): 0.4 SOL",
        "- Legendary (5): 0.5 SOL"
      ],
      "discriminator": [
        111,
        30,
        18,
        17,
        228,
        252,
        239,
        102
      ],
      "accounts": [
        {
          "name": "user",
          "docs": [
            "User claiming the badge"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "treasury",
          "docs": [
            "Treasury account to receive payment"
          ],
          "writable": true
        },
        {
          "name": "config",
          "docs": [
            "Global config account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "badge",
          "docs": [
            "Badge account (PDA per user)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  100,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "incoLightningProgram",
          "docs": [
            "INCO Lightning program for encrypted operations"
          ],
          "address": "5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj"
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "requestedTier",
          "type": "u8"
        },
        {
          "name": "encryptedTierCiphertext",
          "type": "bytes"
        },
        {
          "name": "encryptedThreshold1",
          "type": "bytes"
        },
        {
          "name": "encryptedThreshold2",
          "type": "bytes"
        },
        {
          "name": "encryptedThreshold3",
          "type": "bytes"
        },
        {
          "name": "encryptedThreshold4",
          "type": "bytes"
        },
        {
          "name": "encryptedThreshold5",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "claimPayment",
      "docs": [
        "Initiate a claim on a FULLY PRIVATE payment",
        "",
        "**PRIVACY PRESERVED:**",
        "- Claimer's identity is ENCRYPTED (not stored as pubkey)",
        "- Comparison happens in encrypted space",
        "- Only TRUE recipient will get TRUE when decrypting proof",
        "",
        "**Workflow:**",
        "1. Claimer provides their encrypted address hash",
        "2. Contract compares: e_eq(stored_recipient, claimer_hash)",
        "3. Result is stored as claim_proof (Ebool handle)",
        "4. Claimer decrypts off-chain - if TRUE, call finalize_claim",
        "",
        "**Remaining Accounts (optional):**",
        "- [0] Allowance PDA for claim_proof",
        "- [1] Claimer pubkey"
      ],
      "discriminator": [
        69,
        112,
        250,
        167,
        37,
        156,
        200,
        30
      ],
      "accounts": [
        {
          "name": "claimer",
          "docs": [
            "Person attempting to claim (identity hidden via encrypted_claimer)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "payment",
          "docs": [
            "Payment account"
          ],
          "writable": true
        },
        {
          "name": "incoLightningProgram",
          "docs": [
            "INCO Lightning program for encrypted operations"
          ],
          "address": "5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj"
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "encryptedClaimerCiphertext",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "createPrivatePayment",
      "docs": [
        "Create a FULLY PRIVATE payment",
        "",
        "**ALL DATA IS ENCRYPTED:**",
        "- Sender address: encrypt(hash(sender_pubkey)[0:16])",
        "- Recipient address: encrypt(hash(recipient_pubkey)[0:16])",
        "- Amount: encrypt(amount_in_lamports)",
        "",
        "**WHAT'S VISIBLE ON-CHAIN:**",
        "- Payment ID (random)",
        "- Status (Active/Claimed)",
        "- Timestamps",
        "- Escrow balance (needed for actual transfer)",
        "",
        "**WHAT'S HIDDEN:**",
        "- WHO sent it",
        "- WHO receives it",
        "- HOW MUCH was sent (encrypted version)",
        "",
        "**Parameters:**",
        "- payment_id: Unique 32-byte identifier",
        "- actual_amount: Amount in lamports (needed for escrow transfer)",
        "- encrypted_sender_ciphertext: Encrypted hash of sender address",
        "- encrypted_recipient_ciphertext: Encrypted hash of recipient address",
        "- encrypted_amount_ciphertext: Encrypted amount",
        "- expiry_seconds: Optional expiry time (default 7 days)"
      ],
      "discriminator": [
        191,
        66,
        187,
        101,
        85,
        215,
        55,
        104
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "Payer who funds the escrow (identity hidden via encrypted_sender)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "payment",
          "docs": [
            "Payment account (PDA per payment_id)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "paymentId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "docs": [
            "Escrow account to hold funds (PDA)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "paymentId"
              }
            ]
          }
        },
        {
          "name": "incoLightningProgram",
          "docs": [
            "INCO Lightning program for encrypted operations"
          ],
          "address": "5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj"
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "paymentId",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "actualAmount",
          "type": "u64"
        },
        {
          "name": "encryptedSenderCiphertext",
          "type": "bytes"
        },
        {
          "name": "encryptedRecipientCiphertext",
          "type": "bytes"
        },
        {
          "name": "encryptedAmountCiphertext",
          "type": "bytes"
        },
        {
          "name": "expirySeconds",
          "type": {
            "option": "i64"
          }
        }
      ]
    },
    {
      "name": "finalizeClaim",
      "docs": [
        "Finalize a claim and release funds - FULLY PRIVATE",
        "",
        "**PRIVACY VERIFICATION:**",
        "- Claimer proves identity by providing same encrypted hash",
        "- INCO compares: stored_encrypted_claimer == provided_encrypted_claimer",
        "- Only TRUE match releases funds",
        "",
        "**NO PUBKEY VERIFICATION** - all done via encrypted comparison"
      ],
      "discriminator": [
        86,
        162,
        202,
        241,
        136,
        125,
        52,
        149
      ],
      "accounts": [
        {
          "name": "claimer",
          "docs": [
            "Claimer (identity verified via encrypted comparison)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "payment",
          "docs": [
            "Payment account"
          ],
          "writable": true
        },
        {
          "name": "escrow",
          "docs": [
            "Escrow account holding the funds"
          ],
          "writable": true
        },
        {
          "name": "incoLightningProgram",
          "docs": [
            "INCO Lightning program"
          ],
          "address": "5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj"
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "encryptedClaimerCiphertext",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "grantAccess",
      "docs": [
        "Grant decrypt access to badge handles",
        "",
        "Call this after claim_badge to grant decrypt permission for the stored handles.",
        "Requires 12 remaining_accounts: 6 allowance PDAs + 6 user pubkeys (interleaved)",
        "",
        "Allowance PDA derivation: PDA([handle_bytes_le_16, user_pubkey], INCO_PROGRAM_ID)"
      ],
      "discriminator": [
        66,
        88,
        87,
        113,
        39,
        22,
        27,
        165
      ],
      "accounts": [
        {
          "name": "user",
          "docs": [
            "User requesting access (must be badge owner)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "badge",
          "docs": [
            "Badge account containing the handles"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  100,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "incoLightningProgram",
          "docs": [
            "INCO Lightning program for allow operations"
          ],
          "address": "5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj"
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program (required for allowance PDA creation)"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize the global config (admin only, one-time)"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "admin",
          "docs": [
            "Admin who initializes the config"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "docs": [
            "Global config account (PDA)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program for account creation"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "revokeBadge",
      "docs": [
        "Revoke/deactivate a badge (admin or owner)"
      ],
      "discriminator": [
        108,
        171,
        101,
        185,
        99,
        36,
        98,
        112
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Authority revoking the badge (admin or owner)"
          ],
          "signer": true
        },
        {
          "name": "config",
          "docs": [
            "Global config (to check if authority is admin)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "badge",
          "docs": [
            "Badge account to revoke"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  100,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "badge.owner",
                "account": "confidentialBadge"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "transferBadge",
      "docs": [
        "Transfer badge ownership to another wallet"
      ],
      "discriminator": [
        151,
        130,
        63,
        40,
        9,
        1,
        250,
        77
      ],
      "accounts": [
        {
          "name": "currentOwner",
          "docs": [
            "Current owner of the badge"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "badge",
          "docs": [
            "Badge account to transfer"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  100,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "currentOwner"
              }
            ]
          }
        },
        {
          "name": "incoLightningProgram",
          "docs": [
            "INCO Lightning program"
          ],
          "address": "5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj"
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "newOwner",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updatePrices",
      "docs": [
        "Update tier prices (admin only)",
        "",
        "Allows admin to configure badge prices for each tier.",
        "Prices are in lamports (1 SOL = 1_000_000_000 lamports)"
      ],
      "discriminator": [
        62,
        161,
        234,
        136,
        106,
        26,
        18,
        160
      ],
      "accounts": [
        {
          "name": "admin",
          "docs": [
            "Admin who can update prices"
          ],
          "signer": true
        },
        {
          "name": "config",
          "docs": [
            "Global config account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "priceBronze",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "priceSilver",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "priceGold",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "priceDiamond",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "priceLegendary",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "upgradeTier",
      "docs": [
        "Upgrade tier when user buys a higher badge on mainnet"
      ],
      "discriminator": [
        122,
        56,
        170,
        60,
        252,
        234,
        190,
        51
      ],
      "accounts": [
        {
          "name": "user",
          "docs": [
            "User upgrading the badge (must be owner)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "badge",
          "docs": [
            "Badge account to upgrade"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  100,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "incoLightningProgram",
          "docs": [
            "INCO Lightning program"
          ],
          "address": "5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj"
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "encryptedTierCiphertext",
          "type": "bytes"
        },
        {
          "name": "encryptedThreshold1",
          "type": "bytes"
        },
        {
          "name": "encryptedThreshold2",
          "type": "bytes"
        },
        {
          "name": "encryptedThreshold3",
          "type": "bytes"
        },
        {
          "name": "encryptedThreshold4",
          "type": "bytes"
        },
        {
          "name": "encryptedThreshold5",
          "type": "bytes"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "confidentialBadge",
      "discriminator": [
        127,
        83,
        224,
        126,
        199,
        220,
        233,
        178
      ]
    },
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "privatePayment",
      "discriminator": [
        240,
        103,
        33,
        64,
        100,
        208,
        224,
        134
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidTier",
      "msg": "Invalid tier value. Must be between 1 (Bronze) and 5 (Legendary)"
    },
    {
      "code": 6001,
      "name": "alreadyClaimed",
      "msg": "Badge already claimed for this wallet"
    },
    {
      "code": 6002,
      "name": "badgeNotFound",
      "msg": "Badge not found or not active"
    },
    {
      "code": 6003,
      "name": "unauthorized",
      "msg": "Not authorized to perform this action"
    },
    {
      "code": 6004,
      "name": "cannotDowngrade",
      "msg": "Cannot downgrade tier. New tier must be higher than current"
    },
    {
      "code": 6005,
      "name": "selfTransfer",
      "msg": "Cannot transfer to yourself"
    },
    {
      "code": 6006,
      "name": "badgeInactive",
      "msg": "Badge is not active"
    },
    {
      "code": 6007,
      "name": "alreadyInitialized",
      "msg": "Config already initialized"
    },
    {
      "code": 6008,
      "name": "invalidIncoProgram",
      "msg": "Invalid INCO program"
    },
    {
      "code": 6009,
      "name": "incoOperationFailed",
      "msg": "INCO operation failed"
    },
    {
      "code": 6010,
      "name": "missingAllowAccounts",
      "msg": "Missing required remaining accounts for INCO allow"
    },
    {
      "code": 6011,
      "name": "insufficientAccounts",
      "msg": "Insufficient remaining accounts provided"
    },
    {
      "code": 6012,
      "name": "invalidPaymentAmount",
      "msg": "Payment amount must be greater than zero"
    },
    {
      "code": 6013,
      "name": "paymentAlreadyClaimed",
      "msg": "Payment has already been claimed"
    },
    {
      "code": 6014,
      "name": "paymentNotActive",
      "msg": "Payment is not active"
    },
    {
      "code": 6015,
      "name": "paymentExpired",
      "msg": "Payment has expired"
    },
    {
      "code": 6016,
      "name": "paymentNotExpired",
      "msg": "Payment has not expired yet, cannot cancel"
    },
    {
      "code": 6017,
      "name": "claimNotInitiated",
      "msg": "Claim has not been initiated"
    },
    {
      "code": 6018,
      "name": "claimAlreadyInitiated",
      "msg": "Claim has already been initiated"
    },
    {
      "code": 6019,
      "name": "invalidClaimer",
      "msg": "Invalid claimer - not the address that initiated claim"
    },
    {
      "code": 6020,
      "name": "paymentPending",
      "msg": "Payment is in pending status, waiting for finalization"
    },
    {
      "code": 6021,
      "name": "onlySenderCanCancel",
      "msg": "Only sender can cancel the payment"
    },
    {
      "code": 6022,
      "name": "insufficientEscrowFunds",
      "msg": "Insufficient funds in escrow"
    }
  ],
  "types": [
    {
      "name": "confidentialBadge",
      "docs": [
        "Confidential Whale Badge Account",
        "PRIVACY-FIRST DESIGN:",
        "- NO plain text tier stored (was leaking privacy!)",
        "- NO amount_paid stored (reveals tier via price)",
        "- ONLY encrypted INCO handles stored",
        "- Tier can only be verified via INCO proof decryption"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          },
          {
            "name": "owner",
            "docs": [
              "Current owner of the badge"
            ],
            "type": "pubkey"
          },
          {
            "name": "encryptedTier",
            "docs": [
              "Encrypted tier value (1-5)",
              "INCO Euint128 handle - ONLY way to know tier"
            ],
            "type": "u128"
          },
          {
            "name": "proofBronze",
            "docs": [
              "Pre-computed proof: is tier >= 1 (Bronze+)?",
              "INCO Ebool handle - decrypts to true/false"
            ],
            "type": "u128"
          },
          {
            "name": "proofSilver",
            "docs": [
              "Pre-computed proof: is tier >= 2 (Silver+)?"
            ],
            "type": "u128"
          },
          {
            "name": "proofGold",
            "docs": [
              "Pre-computed proof: is tier >= 3 (Gold+)?"
            ],
            "type": "u128"
          },
          {
            "name": "proofDiamond",
            "docs": [
              "Pre-computed proof: is tier >= 4 (Diamond+)?"
            ],
            "type": "u128"
          },
          {
            "name": "proofLegendary",
            "docs": [
              "Pre-computed proof: is tier >= 5 (Legendary)?"
            ],
            "type": "u128"
          },
          {
            "name": "createdAt",
            "docs": [
              "When the badge was first claimed"
            ],
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "docs": [
              "Last update timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "isActive",
            "docs": [
              "Whether the badge is currently active"
            ],
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "config",
      "docs": [
        "Global configuration account for the program"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "docs": [
              "Admin who can manage the program"
            ],
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "docs": [
              "Treasury wallet to receive payments"
            ],
            "type": "pubkey"
          },
          {
            "name": "totalBadges",
            "docs": [
              "Total number of badges claimed"
            ],
            "type": "u64"
          },
          {
            "name": "isInitialized",
            "docs": [
              "Whether config is initialized"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          },
          {
            "name": "priceBronze",
            "docs": [
              "Price for Bronze tier (default: 0.1 SOL = 100_000_000 lamports)"
            ],
            "type": "u64"
          },
          {
            "name": "priceSilver",
            "docs": [
              "Price for Silver tier (default: 0.2 SOL)"
            ],
            "type": "u64"
          },
          {
            "name": "priceGold",
            "docs": [
              "Price for Gold tier (default: 0.3 SOL)"
            ],
            "type": "u64"
          },
          {
            "name": "priceDiamond",
            "docs": [
              "Price for Diamond tier (default: 0.4 SOL)"
            ],
            "type": "u64"
          },
          {
            "name": "priceLegendary",
            "docs": [
              "Price for Legendary tier (default: 0.5 SOL)"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "paymentStatus",
      "docs": [
        "Payment status enum"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "pending"
          },
          {
            "name": "claimed"
          },
          {
            "name": "cancelled"
          },
          {
            "name": "expired"
          }
        ]
      }
    },
    {
      "name": "privatePayment",
      "docs": [
        "Fully Private Payment Account",
        "ALL sensitive data is encrypted using INCO Lightning",
        "Nobody can see sender, recipient, or amount on-chain"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          },
          {
            "name": "paymentId",
            "docs": [
              "Unique payment identifier (32 bytes) - public"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "encryptedSender",
            "docs": [
              "Encrypted hash of SENDER's address",
              "Created by sender: encrypt(hash(sender_pubkey)[0:16])",
              "Even the sender identity is hidden!"
            ],
            "type": "u128"
          },
          {
            "name": "encryptedRecipient",
            "docs": [
              "Encrypted hash of RECIPIENT's address",
              "Created by sender: encrypt(hash(recipient_pubkey)[0:16])",
              "Nobody knows who the payment is for"
            ],
            "type": "u128"
          },
          {
            "name": "encryptedAmount",
            "docs": [
              "Encrypted payment AMOUNT (in lamports)",
              "Created by sender: encrypt(amount)",
              "The actual amount is hidden!"
            ],
            "type": "u128"
          },
          {
            "name": "claimProof",
            "docs": [
              "Proof handle from e_eq comparison (Ebool)",
              "Set when someone attempts to claim",
              "Decrypts to TRUE only for real recipient"
            ],
            "type": "u128"
          },
          {
            "name": "encryptedClaimer",
            "docs": [
              "Encrypted claimer hash (also hidden!)",
              "We don't store the actual claimer address"
            ],
            "type": "u128"
          },
          {
            "name": "claimInitiated",
            "docs": [
              "Whether a claim has been initiated"
            ],
            "type": "bool"
          },
          {
            "name": "createdAt",
            "docs": [
              "When the payment was created"
            ],
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "docs": [
              "Expiry timestamp (sender can cancel after this)"
            ],
            "type": "i64"
          },
          {
            "name": "claimedAt",
            "docs": [
              "When the payment was claimed (0 if not claimed)"
            ],
            "type": "i64"
          },
          {
            "name": "status",
            "docs": [
              "Payment status"
            ],
            "type": {
              "defined": {
                "name": "paymentStatus"
              }
            }
          },
          {
            "name": "escrowBump",
            "docs": [
              "Escrow bump for PDA signing"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ]
};
