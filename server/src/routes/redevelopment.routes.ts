import { Router, Request, Response } from 'express';
import { getRedevelopmentProjects } from '../services/redevelopment.service';

const router = Router();

// GET /api/redevelopment?region=11&swLat=&swLng=&neLat=&neLng=
// 정비사업(재개발·재건축·뉴타운) 구역 목록 반환
router.get('/', async (req: Request, res: Response) => {
  try {
    const parse = (v: unknown): number | undefined => {
      const n = parseFloat(v as string);
      return isNaN(n) ? undefined : n;
    };
    const { region, swLat, swLng, neLat, neLng } = req.query;
    const sw = parse(swLat);
    const sLng = parse(swLng);
    const ne = parse(neLat);
    const nLng = parse(neLng);
    const bbox =
      sw != null && sLng != null && ne != null && nLng != null
        ? { swLat: sw, swLng: sLng, neLat: ne, neLng: nLng }
        : undefined;

    const projects = await getRedevelopmentProjects(region as string | undefined, bbox);
    res.json({ success: true, data: projects, isMock: true });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'REDEVELOPMENT_ERROR', message: '정비사업 데이터 조회 실패' } });
  }
});

export default router;
