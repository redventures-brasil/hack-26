type Variant = "video" | "images";

type Props = {
  variant: Variant;
  uploaded?: boolean;
};

export function UploadDropzone({ variant, uploaded = false }: Props) {
  if (variant === "video") {
    if (uploaded) {
      return (
        <div className="dz video uploaded">
          <div className="dz-thumb video-thumb">
            <div className="play">▶</div>
            <div className="dz-thumb-grain" />
          </div>
          <div className="dz-meta">
            <div className="dz-name">pitch-refila-final.mp4</div>
            <div className="dz-sub t-mono-num">02:48 · 87.4 MB · uploaded</div>
          </div>
          <button type="button" className="dz-remove">
            remover
          </button>
        </div>
      );
    }
    return (
      <div className="dz video empty">
        <div className="dz-icon">↑</div>
        <div className="dz-text">
          <strong>Arraste o vídeo</strong> ou <span className="ed-link">escolha do disco</span>
        </div>
        <div className="dz-hint">.mp4 / .mov · até 500 MB · sobe direto pro storage</div>
      </div>
    );
  }

  if (uploaded) {
    return (
      <div className="dz images uploaded">
        <div className="img-grid">
          {[1, 2, 3, 4].map((i) => (
            <div className="img-tile" key={i}>
              <div className={`img-thumb v${i}`} />
              <button type="button" className="img-remove" aria-label={`remover ${i}`}>
                ×
              </button>
              <div className="img-name t-mono-num">shot-{i}.png</div>
            </div>
          ))}
          <div className="img-tile add">
            <div className="img-add">＋</div>
            <div className="img-add-text">adicionar mais</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dz images empty">
      <div className="dz-icon">↑</div>
      <div className="dz-text">
        <strong>Arraste 1 a 5 imagens</strong> ou{" "}
        <span className="ed-link">escolha do disco</span>
      </div>
      <div className="dz-hint">.png / .jpg / .webp · até 10 MB cada</div>
    </div>
  );
}
