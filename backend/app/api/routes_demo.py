"""College Presentation Demo Mode Endpoints."""
import logging
from pathlib import Path
from typing import List
import numpy as np
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from backend.app.config import settings
from backend.app.schemas.prediction import DemoSampleItem, PredictionResponse
from backend.app.services.inference_service import inference_service

logger = logging.getLogger("routes_demo")
router = APIRouter(prefix="/api", tags=["Demo Mode"])


@router.get("/demo-samples", response_model=List[DemoSampleItem], summary="List available demo samples")
def list_demo_samples():
    """Lists pre-prepared demonstration EEG samples from the Kara One dataset."""
    samples: List[DemoSampleItem] = []
    demo_dir = settings.DEMO_SAMPLES_DIR

    if not demo_dir.exists():
        return samples

    for f in sorted(demo_dir.glob("*.npz")):
        sample_id = f.stem
        try:
            data = np.load(f, allow_pickle=True)
            subj = str(data.get("subject", "MM05"))
            ds = str(data.get("dataset", "Kara One"))
            label = str(data["label"]) if "label" in data else None
            cat = str(data.get("category", "Paralyzed Patient Needs" if "patient" in sample_id else "Academic Benchmark"))
            intent = str(data.get("intent", "")) if "intent" in data else None
        except Exception:
            subj = "MM05"
            ds = "Kara One"
            label = None
            cat = "Academic Benchmark"
            intent = None

        samples.append(
            DemoSampleItem(
                id=sample_id,
                dataset=ds,
                subject=subj,
                label=label,
                file_size_bytes=f.stat().st_size,
                category=cat,
                intent=intent,
            )
        )

    return samples


@router.post(
    "/predict-demo/{sample_id}",
    response_model=PredictionResponse,
    summary="Run inference on a prepared demo EEG sample",
)
def predict_demo_sample(sample_id: str):
    """Executes the full imagined speech pipeline on a verified pre-recorded Kara One sample.

    Includes ground-truth validation for college evaluation.
    """
    clean_id = Path(sample_id).stem
    sample_file = settings.DEMO_SAMPLES_DIR / f"{clean_id}.npz"

    if not sample_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Demo sample '{clean_id}' not found in {settings.DEMO_SAMPLES_DIR}. "
                "Ensure scripts/prepare_kara_one.py has been executed or samples placed in data/kara_one/demo_samples/."
            ),
        )

    try:
        result = inference_service.run_pipeline(
            file_path=sample_file,
            original_filename=f"{clean_id}.npz",
        )
        return result
    except Exception as e:
        logger.error(f"Error evaluating demo sample {sample_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process demo sample: {e}",
        )


@router.get("/download-sample/{filename}", summary="Download a sample EEG recording file (.npz or .mat)")
def download_sample_file(filename: str):
    """Download an individual pre-recorded EEG sample file for offline presentation or upload testing."""
    clean_name = Path(filename).name
    file_path = settings.DEMO_SAMPLES_DIR / clean_name

    # If extension omitted, default to .npz
    if not file_path.exists() and not clean_name.endswith((".npz", ".mat")):
        file_path = settings.DEMO_SAMPLES_DIR / f"{clean_name}.npz"
        clean_name = f"{clean_name}.npz"

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"EEG sample file '{clean_name}' not found.",
        )

    media_type = "application/octet-stream"
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=clean_name,
    )


@router.get("/download-all-samples", summary="Download full package of EEG demo recordings as ZIP")
def download_all_samples():
    """Download the complete ZIP archive of all 14 EEG recordings in both .npz and .mat formats."""
    zip_path = settings.DEMO_SAMPLES_DIR / "eeg_patient_demo_samples.zip"

    if not zip_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo samples ZIP package not found.",
        )

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename="eeg_patient_demo_samples.zip",
    )
