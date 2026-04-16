import Link from 'next/link';
import Image from 'next/image';
import { Mission } from '@/types';

interface Props { mission: Mission; progress?: number }

export default function MissionCard({ mission, progress }: Props) {
  return (
    <Link href={`/missions/${mission.id}`}>
      <div className="rounded-xl overflow-hidden bg-white border border-[#E2E8F0] hover:shadow-md transition-shadow">
        <div className="relative h-32 bg-[#F59E0B]/10">
          {mission.thumbnailUrl ? (
            <Image src={mission.thumbnailUrl} alt={mission.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">🎯</div>
          )}
          {progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
              <div className="h-full bg-[#F59E0B] transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-[#1A2F4B] line-clamp-2">{mission.title}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-[#64748B]">{'★'.repeat(mission.difficulty)}{'☆'.repeat(5 - mission.difficulty)} · {mission.estimatedMinutes}분</span>
            <span className="text-xs text-[#F59E0B] font-medium">{mission.reward.description}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
