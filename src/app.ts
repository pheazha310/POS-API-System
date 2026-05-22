import express from 'express';

import { env } from './config/env';
import { HTTP_STATUS } from './constants/http-status';
import { MESSAGES } from './constants/messages';
import { errorHandler } from './core/middlewares/error-handler';
import { notFoundHandler } from './core/middlewares/not-found';
import { checkoutRouter } from './modules/checkout/routes/checkout.routes';
import { reportRouter } from './modules/reports/routes/report.routes';
import { saleRouter } from './modules/sales/routes/sale.routes';

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res
    .status(HTTP_STATUS.OK)
    .type('html')
    .send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>POS API System</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f3f7f2;
        --ink: #163020;
        --muted: #597164;
        --panel: rgba(255, 255, 255, 0.88);
        --panel-strong: #ffffff;
        --line: #d7e3d7;
        --accent: #1f7a4d;
        --accent-2: #d98b32;
        --chip: #edf8f0;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Trebuchet MS", "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at 10% 10%, rgba(217, 139, 50, 0.22) 0, transparent 24%),
          radial-gradient(circle at 90% 20%, rgba(31, 122, 77, 0.18) 0, transparent 26%),
          linear-gradient(135deg, #eef8ee 0%, var(--bg) 45%, #fdf8ef 100%);
        color: var(--ink);
      }

      main {
        max-width: 1100px;
        margin: 0 auto;
        padding: 40px 20px 64px;
      }

      .hero,
      .panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 28px;
        box-shadow: 0 24px 60px rgba(22, 48, 32, 0.08);
        backdrop-filter: blur(10px);
      }

      .hero {
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: 24px;
        padding: 28px;
        margin-bottom: 22px;
      }

      .badge {
        display: inline-block;
        padding: 7px 12px;
        border-radius: 999px;
        background: var(--chip);
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      h1 {
        margin: 16px 0 10px;
        font-size: clamp(2.2rem, 4vw, 4.2rem);
        line-height: 0.98;
        letter-spacing: -0.04em;
      }

      p {
        margin: 0;
        color: var(--muted);
        font-size: 1rem;
        line-height: 1.75;
      }

      .hero-meta {
        display: grid;
        gap: 14px;
      }

      .hero-box {
        background: var(--panel-strong);
        border: 1px solid var(--line);
        border-radius: 22px;
        padding: 18px;
      }

      .hero-box strong,
      .section-title,
      .endpoint-method {
        color: var(--ink);
      }

      .hero-box code,
      .mini-code,
      .endpoint-method {
        font-family: Consolas, "Courier New", monospace;
      }

      .hero-box code {
        display: inline-block;
        margin-top: 10px;
        padding: 8px 10px;
        border-radius: 12px;
        background: #f8fbf7;
        border: 1px solid var(--line);
        color: var(--accent);
      }

      .layout {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 22px;
      }

      .panel {
        padding: 24px;
      }

      .section-title {
        margin: 0 0 14px;
        font-size: 1.15rem;
      }

      .endpoint-list {
        display: grid;
        gap: 14px;
      }

      .endpoint {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px;
        border-radius: 18px;
        background: var(--panel-strong);
        border: 1px solid var(--line);
      }

      .endpoint-method {
        min-width: 58px;
        padding: 8px 10px;
        border-radius: 12px;
        background: #eff8f2;
        color: var(--accent);
        font-size: 0.9rem;
        text-align: center;
        font-weight: 700;
      }

      .endpoint-copy {
        flex: 1;
      }

      .endpoint-copy h3 {
        margin: 0 0 4px;
        font-size: 1rem;
      }

      .endpoint-copy p {
        font-size: 0.94rem;
      }

      .endpoint-link {
        color: var(--accent);
        text-decoration: none;
        font-weight: 700;
        word-break: break-word;
      }

      .endpoint-link:hover {
        text-decoration: underline;
      }

      .tips {
        display: grid;
        gap: 12px;
      }

      .tip {
        padding: 16px;
        border-radius: 18px;
        background: linear-gradient(180deg, #fff 0%, #f9fcf8 100%);
        border: 1px solid var(--line);
      }

      .tip strong {
        display: block;
        margin-bottom: 6px;
      }

      .mini-code {
        display: inline-block;
        margin-top: 8px;
        padding: 6px 10px;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: #f6fbf6;
        color: var(--accent);
      }

      @media (max-width: 860px) {
        .hero,
        .layout {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div>
          <span class="badge">POS API SYSTEM</span>
          <h1>${MESSAGES.APP_WELCOME}</h1>
          <p>This server is live on <strong>http://localhost:${env.port}</strong>. Use this page as a quick entry point for your checkout, sales, and report endpoints while developing.</p>
        </div>
        <div class="hero-meta">
          <div class="hero-box">
            <strong>Base URL</strong>
            <code>http://localhost:${env.port}</code>
          </div>
          <div class="hero-box">
            <strong>API Prefix</strong>
            <code>${env.apiPrefix}</code>
          </div>
        </div>
      </section>

      <section class="layout">
        <section class="panel">
          <h2 class="section-title">Available Endpoints</h2>
          <div class="endpoint-list">
            <article class="endpoint">
              <div class="endpoint-method">GET</div>
              <div class="endpoint-copy">
                <h3>Health Check</h3>
                <a class="endpoint-link" href="/health">/health</a>
                <p>Verify that the API process is running.</p>
              </div>
            </article>
            <article class="endpoint">
              <div class="endpoint-method">POST</div>
              <div class="endpoint-copy">
                <h3>Checkout</h3>
                <a class="endpoint-link" href="${env.apiPrefix}/checkout">${env.apiPrefix}/checkout</a>
                <p>Create a checkout transaction from cart items.</p>
              </div>
            </article>
            <article class="endpoint">
              <div class="endpoint-method">GET</div>
              <div class="endpoint-copy">
                <h3>Sales</h3>
                <a class="endpoint-link" href="${env.apiPrefix}/sales">${env.apiPrefix}/sales</a>
                <p>List all recorded sales transactions.</p>
              </div>
            </article>
            <article class="endpoint">
              <div class="endpoint-method">GET</div>
              <div class="endpoint-copy">
                <h3>Daily Report</h3>
                <a class="endpoint-link" href="${env.apiPrefix}/reports/daily">${env.apiPrefix}/reports/daily</a>
                <p>Get totals for a single day. Optional query: <span class="mini-code">?date=2026-05-21</span></p>
              </div>
            </article>
            <article class="endpoint">
              <div class="endpoint-method">GET</div>
              <div class="endpoint-copy">
                <h3>Monthly Report</h3>
                <a class="endpoint-link" href="${env.apiPrefix}/reports/monthly">${env.apiPrefix}/reports/monthly</a>
                <p>Get totals for a month. Optional query: <span class="mini-code">?month=5&year=2026</span></p>
              </div>
            </article>
          </div>
        </section>

        <aside class="panel">
          <h2 class="section-title">Quick Notes</h2>
          <div class="tips">
            <div class="tip">
              <strong>Browser</strong>
              <p>Open GET endpoints directly from this page to inspect responses quickly.</p>
            </div>
            <div class="tip">
              <strong>Postman</strong>
              <p>Use Postman or Thunder Client for the checkout POST endpoint.</p>
            </div>
            <div class="tip">
              <strong>Current Mode</strong>
              <p>The app currently uses lightweight in-memory sales/report data unless you wire in the database layer.</p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  </body>
</html>`);
});

app.get('/health', (_req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: MESSAGES.APP_RUNNING,
  });
});

app.use(`${env.apiPrefix}/checkout`, checkoutRouter);
app.use(`${env.apiPrefix}/reports`, reportRouter);
app.use(`${env.apiPrefix}/sales`, saleRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
