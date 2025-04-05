package cn.bklovezz.api.invokegrpcstudentclient.controller;

import cn.bklovezz.api.invokegrpcstudentclient.client.StudentClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Slf4j
@RequestMapping("/student")
@RequiredArgsConstructor
public class StudentController {
    private final StudentClient studentClient;

    @GetMapping("/info-list")
    public Object getStudentInfoList(
            Integer pageNum,
            Integer pageSize,
            String name
    ) {
        log.info("studentClient -> {}", studentClient);
        return studentClient.getStudentInfoList(pageNum, pageSize, name);
    }
}
