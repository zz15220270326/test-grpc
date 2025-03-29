package cn.bklovezz.api.invokegrpcstudentservice.domain.po;

import lombok.Data;

@Data
public class StudentScorePO {
    private Long scoreId;

    private Long id;

    private Double chineseScore;

    private Double mathScore;

    private Double englishScore;
}
