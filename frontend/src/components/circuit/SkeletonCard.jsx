import { Card, Skeleton, Box } from '@mui/material';

export function SkeletonCard() {
  return (
    <Card sx={{ p: 2.5, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton variant="rounded" width={42} height={42} />
        <Skeleton variant="circular" width={32} height={32} />
      </Box>
      <Skeleton variant="text" width="60%" height={30} sx={{ mt: 1.5 }} />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="80%" />
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Skeleton variant="rounded" width={70} height={22} />
        <Skeleton variant="rounded" width={70} height={22} />
      </Box>
    </Card>
  );
}

export function SkeletonGrid({ count = 6, Grid }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <SkeletonCard />
        </Grid>
      ))}
    </>
  );
}
