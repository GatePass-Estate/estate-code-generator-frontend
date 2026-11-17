import { useState } from 'react';
import { Image } from 'react-native';
import CountdownRing from '@/src/shared/components/CountdownRing';
import icons from '@/src/shared/constants/icons';
import { useRouter } from 'expo-router';
import Modal from '@/src/shared/components/feedback/Modal';
import { GenderType } from '@/src/shared/types/general';

type CodeCardProps = {
  code: string;
  estate_id?: string | null;
  details: {
    name: string;
    address: string;
    date: string;
    timeframe: string;
  };
  variant?: GenderType;
  timeLeftMinutes?: number;
  removeCode: (code: string) => Promise<void>;
  onExpire?: () => void;
};

export const variantStyles = {
  prefer_not_to_say: {
    container: 'bg-light-grey border-grey',
    text: 'text-grey',
    action: 'bg-grey',
  },
  female: {
    container: 'bg-light-orange border-orange',
    text: 'text-orange',
    action: 'bg-orange',
  },
  male: {
    container: 'bg-light-teal border-teal',
    text: 'text-teal',
    action: 'bg-teal',
  },
};

const CodeCard = ({
  code,
  details,
  variant = 'prefer_not_to_say',
  timeLeftMinutes,
  estate_id,
  removeCode,
  onExpire,
}: CodeCardProps) => {
  const router = useRouter();

  const styles = variantStyles[variant!];

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteCode = async () => {
    try {
      setDeleting(true);
      await removeCode(code as string);
      setConfirmOpen(false);
    } catch {
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex relative ">
      <div
        className={`border p-7 rounded-lg flex flex-col gap-4 z-10 ${styles.container} ${styles.text}`}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="uppercase text-xs">access code</h3>
            <p
              className="text-4xl text-[40px] font-semibold tracking-[0.25em] mt-2 font-UbuntuSans uppercase"
              style={{
                textShadow: '0px 4px 4px 0px #00000040 inset',
              }}
            >
              {code}
            </p>
          </div>

          <div>
            <CountdownRing expiresAt={timeLeftMinutes!} size={55} onExpire={onExpire} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="web-access-code-details">
            <span className="web-access-code-details-heading">Name:</span>
            <span className="web-access-code-details-content">{details?.name}</span>
          </div>
          <div className="web-access-code-details">
            <span className="web-access-code-details-heading">Address:</span>
            <span className="web-access-code-details-content">{details?.address}</span>
          </div>
          <div className="web-access-code-details">
            <span className="web-access-code-details-heading">Date:</span>
            <span className="web-access-code-details-content">{details?.date}</span>
          </div>
          <div className="web-access-code-details">
            <span className="web-access-code-details-heading">Timeframe:</span>
            <span className="web-access-code-details-content">{details?.timeframe}</span>
          </div>
        </div>
      </div>

      <div
        className={`${styles.action} relative -left-8 pl-10 p-2 rounded-xl gap-5 flex flex-col h-fit`}
      >
        <div className="cursor-pointer" id="delete-btn" onClick={() => setConfirmOpen(true)}>
          <Image source={icons.deleteIcon} resizeMode="contain" style={{ width: 24, height: 24 }} />
        </div>

        <div
          className="cursor-pointer"
          onClick={() =>
            router.push({
              pathname: '/invite',
              params: {
                code,
                name: details.name,
                address: details.address,
                timeframe: details.timeframe,
                date: details.date,
              },
            })
          }
        >
          <Image source={icons.shareIcon} resizeMode="contain" style={{ width: 24, height: 24 }} />
        </div>

        {confirmOpen && (
          <Modal
            closeModal={() => setConfirmOpen(false)}
            heading={'Confirm delete'}
            message={`Are you sure you want to delete access code ${code}? This action cannot be undone.`}
            btnDisabled={deleting}
            actionRunnig={deleting}
            cancelText={'Cancel'}
            action={deleteCode}
            runningText={'Deleting...'}
            actionText={'Delete'}
          />
        )}
      </div>
    </div>
  );
};

export default CodeCard;
