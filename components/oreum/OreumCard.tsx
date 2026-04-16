import Link from 'next/link';
import Image from 'next/image';
import { Oreum } from '@/types';

interface Props {
  oreum: Oreum;
  isStamped?: boolean;
}

export default function OreumCard({ oreum, isStamped = false }: Props) {
  return (
    <Link href={`/oreums/${oreum.id}`}>
      <div className="rounded-xl overflow-hidden bg-white border border-[#E2E8F0] hover:shadow-md transition-all">
        <div className="relative h-36">
          {oreum.thumbnailUrl ? (
            <Image src={oreum.thumbnailUrl} alt={oreum.name} fill
              className={`object-cover transition-all ${isStamped ? '' : 'grayscale'}`} />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-3xl ${isStamped ? 'bg-[#4CAF50]/10' : 'bg-gray-100'}`}>
              {isStamped ? '🌿' : '🔒'}
            </div>
          )}
          {!isStamped && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="text-white text-2xl">🔒</span>
            </div>
          )}
          {isStamped && (
            <div className="absolute top-2 right-2 bg-[#22C55E] text-white text-xs px-2 py-0.5 rounded-full font-medium">
              인증완료
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-[#1A2F4B]">{oreum.name}</p>
          <p className="text-xs text-[#64748B] mt-0.5">{oreum.region} {oreum.altitude > 0 ? `· ${oreum.altitude}m` : ''}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-[#F59E0B]">{'★'.repeat(oreum.difficulty)}{'☆'.repeat(5 - oreum.difficulty)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
