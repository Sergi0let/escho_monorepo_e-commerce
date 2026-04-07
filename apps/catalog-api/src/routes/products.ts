import * as catalog from '@repo/db';
import type express from 'express';
import { listByColor, parseListFilters } from '../utils/env-config.js';
import { sendInternalError } from '../utils/internal-error.js';

export function registerProductRoutes(app: express.Express): void {
	app.get('/api/products/count', async (req, res) => {
		try {
			const filters = parseListFilters(req);
			const count = listByColor()
				? await catalog.countColorCards(filters)
				: await catalog.countStockedProducts(filters);
			res.json({ count });
		} catch (e) {
			sendInternalError(res, e, 'products/count');
		}
	});

	app.get('/api/products', async (req, res) => {
		try {
			const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 48));
			const offset = Math.max(0, Number(req.query.offset) || 0);
			const filters = parseListFilters(req);
			const data = listByColor()
				? await catalog.getColorCardsPage(limit, offset, filters)
				: await catalog.getStockedProductsPage(limit, offset, filters);
			res.json(data);
		} catch (e) {
			sendInternalError(res, e, 'products/list');
		}
	});

	app.get('/api/catalog/filter-options', async (req, res) => {
		try {
			const raw = req.query.categoryId;
			const categoryId =
				typeof raw === 'string' && /^\d+$/.test(raw) ? BigInt(raw) : null;
			const data = await catalog.getCatalogFilterOptions(
				categoryId,
				listByColor(),
			);
			res.json(data);
		} catch (e) {
			sendInternalError(res, e, 'catalog/filter-options');
		}
	});

	// Feature recommended products /api/products/featured/balanced?limit=12
	app.get('/api/products/featured/balanced', async (req, res) => {
		try {
			const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
			const data = await catalog.getFeaturedProductsBalanced(limit);
			res.json(data);
		} catch (e) {
			sendInternalError(res, e, 'products/featured');
		}
	});

	app.get('/api/products/detail/:id', async (req, res) => {
		try {
			const id = req.params.id;
			if (
				!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
					id,
				)
			) {
				res.status(400).json({ error: 'Invalid product id' });
				return;
			}
			const row = await catalog.getProductById(id);
			if (!row) {
				res.status(404).json({ error: 'Not found' });
				return;
			}
			res.json(row);
		} catch (e) {
			sendInternalError(res, e, 'products/detail');
		}
	});

	app.get('/api/products/:id/colors', async (req, res) => {
		try {
			const id = req.params.id;
			if (
				!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
					id,
				)
			) {
				res.status(400).json({ error: 'Invalid product id' });
				return;
			}
			const data = await catalog.getProductColorsWithSkus(id);
			res.json(data);
		} catch (e) {
			sendInternalError(res, e, 'products/colors');
		}
	});
}
