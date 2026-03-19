import { Router, Request, Response } from 'express';
import { getRenewalProjects } from '../services/renewal.service';

const router = Router();

// GET /api/renewal?swLat=&swLng=&neLat=&neLng=
// 뷰포트 내 정비사업(재개발·재건축) 구역 목록 반환
router.get('/', (req: Request, res: Response) => {
  const parse = (v: unknown): number | undefined => {
    const n = parseFloat(v as string);
    return isNaN(n) ? undefined : n;
  };
  const { swLat, swLng, neLat, neLng } = req.query;
  const projects = getRenewalProjects(parse(swLat), parse(swLng), parse(neLat), parse(neLng));
  res.json({ success: true, data: projects, isMock: true });
});

export default router;
