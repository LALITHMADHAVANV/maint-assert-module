'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AssetTypesRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const category = searchParams.get('category') || '';
    const type = searchParams.get('type') || '';
    const assetId = searchParams.get('assetId') || '';

    const targetParams = new URLSearchParams();
    if (category) targetParams.set('category', category);
    if (type) targetParams.set('type', type);
    if (assetId) targetParams.set('assetId', assetId);
    targetParams.set('openModal', 'true');

    router.replace(`/dashboard/floor-tracker?${targetParams.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-600">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      <div className="text-sm font-semibold text-slate-800">
        Loading Factory Asset & Category Details...
      </div>
      <p className="text-xs text-slate-500">
        Opening interactive asset specifications modal on the Floor Grid.
      </p>
    </div>
  );
}

export default function AssetTypesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <AssetTypesRedirectContent />
    </Suspense>
  );
}
