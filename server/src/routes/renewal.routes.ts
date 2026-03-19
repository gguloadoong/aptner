import { Router, Request, Response } from 'express';
import { getRenewalProjects } from '../services/renewal.service';

const router = Router();

// GET /api/renewal?swLat=&swLng=&neLat=&neLng=
// 뷰포트 내 정비사업(재개발·재건축) 구역 목록 반환
router.get('/', (req: Request, res: Response) => {
  const { swLat, swLng, neLat, neLng } = req.query;
  const projects = getRenewalProjects(
    swLat ? parseFloat(swLat as string) : undefined,
    swLng ? parseFloat(swLng as string) : undefined,
    neLat ? parseFloat(neLat as string) : undefined,
    neLng ? parseFloat(neLng as string) : undefined,
  );
  res.json({ success: true, data: projects, isMock: true });
});

export default router;
