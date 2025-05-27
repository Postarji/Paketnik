import cv2 as cv
import numpy as np

def obdelaj_sliko_s_skatlami(slika, sirina_skatle, visina_skatle, barva_koze) -> list:
    '''Sprehodi se skozi sliko v velikosti škatle (sirina_skatle x visina_skatle) in izračunaj število pikslov kože v vsaki škatli.
    Škatle se ne smejo prekrivati!
    Vrne seznam škatel, s številom pikslov kože.
    Primer: Če je v sliki 25 škatel, kjer je v vsaki vrstici 5 škatel, naj bo seznam oblike
      [[1,0,0,1,1],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[1,0,0,0,1]]. 
      V tem primeru je v prvi škatli 1 piksel kože, v drugi 0, v tretji 0, v četrti 1 in v peti 1.'''
    #prazen seznam, shranjuje skatle in in št. pikslov z barvo kože v vsaki škatli 
    rezultat = []
    #pregledam sliko s skatlami določene širine, višine
    for y in range(0, slika.shape[0], visina_skatle):   #premiki po višini
        #prazen seznam za trenutno vrstico škatel
        vrstica=[]
        for x in range(0, slika.shape[1], sirina_skatle):   #premiki po širini
            #izrežemo podsliko-trenutna škatla iz slike
            podslika= slika[y:y+visina_skatle, x:x+sirina_skatle]
            #izračun pikslov v podsliki, ki ustrezajo barvi kože
            stevilo_pikslov=prestej_piklse_z_barvo_koze(podslika, barva_koze)
            #dodamo škatlo in število pikslov z barvo kože v seznam trenutne vrstice
            vrstica.append(stevilo_pikslov)
            #dodamo vrstico v glavni seznam rezultata
        rezultat.append(vrstica)
        #vrnemo seznam s številom pikslov kože
    return rezultat
    pass

def prestej_piklse_z_barvo_koze(slika, barva_koze) -> int:
    '''Prestej število pikslov z barvo kože v škatli.'''
    #maska; piksli ki ustrezajo barvi kože: 1; ostali 0
    maska = cv.inRange(slika, barva_koze[0], barva_koze[1])
    #vrne skupno št. pikslov, ki ustrezajo barvi kože
    return cv.countNonZero(maska)
    pass

def doloci_barvo_koze(slika,levo_zgoraj,desno_spodaj) -> tuple:
    '''Ta funkcija se kliče zgolj 1x na prvi sliki iz kamere. 
    Vrne barvo kože v območju ki ga definira oklepajoča škatla (levo_zgoraj, desno_spodaj).
      Način izračuna je prepuščen vaši domišljiji.'''
    #izrez ROI iz slike - region of interest
    roi = slika[levo_zgoraj[1]:desno_spodaj[1], levo_zgoraj[0]: desno_spodaj[0]]
    #povprečna barva v ROI
    povprecje = np.mean(roi, axis=(0,1))
    #standardni odklon barvnih vrednosti v roi
    odstopanje = np.std(roi, axis=(1,0))
    #izračun zgornje in spodnje meje barve kože
    spodnja_meja=np.maximum(povprecje-odstopanje, 0).astype(int)
    zgornja_meja=np.minimum(povprecje+odstopanje, 255).astype(int)
    return spodnja_meja, zgornja_meja
    pass