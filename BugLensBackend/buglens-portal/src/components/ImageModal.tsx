type ImageModalProps = {
  imageUrl: string | null;
  onClose: () => void;
};

export function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  if (!imageUrl) {
    return null;
  }

  return (
    <div className="image-modal-backdrop" onClick={onClose}>
      <div className="image-modal" onClick={(event) => event.stopPropagation()}>
        <button className="image-modal-close" onClick={onClose}>
          x
        </button>

        <img src={imageUrl} alt="Bug report screenshot" />
      </div>
    </div>
  );
}
