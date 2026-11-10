# PLATA AI — Product Brief (Phase 1)

## Product thesis
A mobile-first personal-finance workspace for Guatemala that helps people record income and expenses, understand spending, and make informed day-to-day decisions. The first version is a tracking and organization tool, not a bank, lender, investment adviser, or accounting/tax authority.

## Target users (hypotheses to validate)
1. People who manage household spending in GTQ and want a clearer monthly picture.
2. Freelancers and informal workers with variable income.
3. Later: microbusiness owners who need a simple cash-flow view (not in initial MVP).

## Core user problem
Financial information is scattered across cash, bank accounts, messages, and paper receipts. Manual recording can be tedious; totals are hard to trust when records are incomplete.

## MVP promise
"Registra y entiende tus ingresos y gastos en quetzales, con una experiencia sencilla y privada."

## MVP scope (phases 1–10)
- Phase 1: product requirements, audience, risk assumptions, MVP boundaries.
- Phase 2: responsive visual system and key screens.
- Phase 3: Next.js/TypeScript app foundation, Supabase/Postgres architecture, environment setup.
- Phase 4: real authentication and user profile foundation.
- Phase 5: accounts, transactions, categories, transfers, budgets and deterministic balance calculations.
- Phase 6: optional AI receipt extraction and Q&A, with user confirmation before saving.
- Phase 7: reports, trends and budget progress.
- Phase 8: subscriptions only after payment-provider availability/terms are verified for Guatemala.
- Phase 9: admin operations, rate limits, audit events, retention and incident controls.
- Phase 10: testing, production release and commercial validation.

## Explicit non-goals for MVP
- Direct bank-account connections or scraping banking credentials.
- Moving money, holding deposits, lending, credit scoring, investment advice, or guaranteed savings.
- Automatic saving of AI-extracted receipts without user review.
- Business accounting/tax compliance claims.
- Displaying fabricated or seeded financial totals as if they were user data.

## Product success measures (initial hypotheses)
- Activation: user completes sign-up and records at least 3 transactions in first 24 hours.
- Week-4 retention: users return and log/review financial activity.
- Data quality: percentage of user-confirmed receipts with corrected amount/date/vendor.
- Trust: support reports for wrong balances, data leakage, or mistaken AI claims.
- Monetization: conversion only after recurring usage and willingness-to-pay interviews.

## Socratic assumptions to challenge
1. Is AI receipt scanning the first reason users return, or is accurate and low-friction tracking more valuable?
2. Will users pay Q29–Q49 monthly for a personal finance tool in Guatemala? This is unvalidated, not a forecast.
3. Will users trust receipt photos and transaction details in a cloud app? Need plain-language privacy and retention controls.
4. Is the target household user or independent worker? The MVP should not attempt both deeply at once.
5. What does “available balance” mean when users manually maintain accounts? It must be defined as a calculated ledger balance, not a live bank balance.

## Current product decision
Start with personal finance in Guatemala, GTQ default, Spanish-first (es-GT), mobile-first PWA. Keep other currencies technically possible, but do not promise FX conversion until rates, timestamps and rounding policy are implemented.
